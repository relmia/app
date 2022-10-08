// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {ISuperfluid, ISuperToken, ISuperApp, ISuperAgreement, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

import 'hardhat/console.sol';

/// @dev Constant Flow Agreement registration key, used to get the address from the host.
bytes32 constant CFA_ID = keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");

/// @dev Thrown when the receiver is the zero adress.
    error InvalidReceiver();

/// @dev Thrown when receiver is also a super app.
    error ReceiverIsSuperApp();

/// @dev Thrown when the callback caller is not the host.
    error Unauthorized();

/// @dev Thrown when the token being streamed to this contract is invalid
    error InvalidToken();

/// @dev Thrown when the agreement is other than the Constant Flow Agreement V1
    error InvalidAgreement();

struct WinningBid { 
   bool set;
   address sender;
   int256 flow;
}

/// @title Stream Redirection Contract
/// @notice This contract is a registered super app, meaning it receives
contract BillboardFlow is SuperAppBase {
    // CFA library setup
    using CFAv1Library for CFAv1Library.InitData;
    CFAv1Library.InitData public cfaV1Lib;

    /// @dev Super token that may be streamed to this contract
    ISuperToken internal immutable _acceptedToken;

    /// @notice This is the current receiver that all streams will be redirected to.
    address public _receiver;

    ISuperfluid private _host;

    uint96 _currentFlow;

    WinningBid internal _winningBid;

    constructor(
        ISuperfluid host,
        ISuperToken acceptedToken,
        address receiver
    ) {
        assert(address(host) != address(0));
        assert(address(acceptedToken) != address(0));
        assert(receiver != address(0));

        _acceptedToken = acceptedToken;
        _receiver = receiver;
        _host = host;

        _winningBid.set = false;

        cfaV1Lib = CFAv1Library.InitData({
        host : host,
        cfa : IConstantFlowAgreementV1(address(host.getAgreementClass(CFA_ID)))
        });

        // Registers Super App, indicating it is the final level (it cannot stream to other super
        // apps), and that the `before*` callbacks should not be called on this contract, only the
        // `after*` callbacks.
        host.registerApp(
            SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP
        );
    }

    // ---------------------------------------------------------------------------------------------
    // EVENTS

    /// @dev Logged when the receiver changes
    /// @param receiver The new receiver address.
    event ReceiverChanged(address indexed receiver);

    // ---------------------------------------------------------------------------------------------
    // MODIFIERS

    modifier onlyHost() {
        if (msg.sender != address(cfaV1Lib.host)) revert Unauthorized();
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        if (superToken != _acceptedToken) revert InvalidToken();
        if (agreementClass != address(cfaV1Lib.cfa)) revert InvalidAgreement();
        _;
    }

    // ---------------------------------------------------------------------------------------------
    // RECEIVER DATA

    /// @notice Returns current receiver's address, start time, and flow rate.
    /// @return startTime Start time of the current flow.
    /// @return receiver Receiving address.
    /// @return flowRate Flow rate from this contract to the receiver.
    function currentReceiver()
    external
    view
    returns (
        uint256 startTime,
        address receiver,
        int96 flowRate
    )
    {
        if (receiver != address(0)) {
            (startTime, flowRate,,) = cfaV1Lib.cfa.getFlow(
                _acceptedToken,
                address(this),
                _receiver
            );

            receiver = _receiver;
        }
    }

    function _updateCurrentWinningBid(address sender, int256 _winningBidFlow) internal {
        _winningBid.set = true;
        _winningBid.sender = sender;
        _winningBid.flow = _winningBidFlow;
    }

    // ---------------------------------------------------------------------------------------------
    // SUPER APP CALLBACKS

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata _agreementData,
        bytes calldata, //_cbdata
        bytes calldata _ctx
    )
    external
    override
    onlyExpected(_superToken, _agreementClass)
    onlyHost
    returns (bytes memory newCtx)
    {
        // get the newly created flow's rate
        (, int256 newAgreementFlowRate, ,) = cfaV1Lib.cfa.getFlowByID(_superToken, _agreementId);
        // if there is a current winning bid
        if (_winningBid.set)  {
            // if the new flow rate is less than the current bid flow rate reject it
            if (newAgreementFlowRate <= _winningBid.flow) {
                revert("New flow rate is lass than current winning flow rate");
            } else {
                address from = _winningBid.sender;
                address to = address(this);
                // bytes newCtx = _ctx;
                
                cfaV1Lib.deleteFlowWithCtx(_ctx, from, to, _superToken);
            }
        }

        (address sender,) = abi.decode(_agreementData, (address,address));
        _updateCurrentWinningBid(sender, newAgreementFlowRate);
        return _updateOutflow(_ctx);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 _agreementId,
        bytes calldata _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    )
    external
    override
    onlyExpected(_superToken, _agreementClass)
    onlyHost
    returns (bytes memory newCtx)
    {
        (, int256 updatedAgreementFlowRate, ,) = cfaV1Lib.cfa.getFlowByID(_superToken, _agreementId);
        (address sender,) = abi.decode(_agreementData, (address,address));

        _updateCurrentWinningBid(sender, updatedAgreementFlowRate);

        return _updateOutflow(_ctx);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, // _agreementData
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        if (_superToken != _acceptedToken || _agreementClass != address(cfaV1Lib.cfa)) {
            return _ctx;
        }

        return _updateOutflow(_ctx);
    }

    // ---------------------------------------------------------------------------------------------
    // INTERNAL LOGIC

    /// @dev Changes receiver and redirects all flows to the new one. Logs `ReceiverChanged`.
    /// @param newReceiver The new receiver to redirect to.
    function _changeReceiver(address newReceiver) internal {
        if (newReceiver == address(0)) revert InvalidReceiver();

        if (cfaV1Lib.host.isApp(ISuperApp(newReceiver))) revert ReceiverIsSuperApp();

        if (newReceiver == _receiver) return;

        (, int96 outFlowRate, ,) = cfaV1Lib.cfa.getFlow(_acceptedToken, address(this), _receiver);

        if (outFlowRate > 0) {
            cfaV1Lib.deleteFlow(address(this), _receiver, _acceptedToken);

            cfaV1Lib.createFlow(
                newReceiver,
                _acceptedToken,
                cfaV1Lib.cfa.getNetFlow(_acceptedToken, address(this))
            );
        }

        _receiver = newReceiver;

        emit ReceiverChanged(newReceiver);
    }

    /// @dev Updates the outflow. The flow is either created, updated, or deleted, depending on the
    /// net flow rate.
    /// @param ctx The context byte array from the Host's calldata.
    /// @return newCtx The new context byte array to be returned to the Host.
    function _updateOutflow(bytes calldata ctx) private returns (bytes memory newCtx) {
        newCtx = ctx;

        int96 netFlowRate = cfaV1Lib.cfa.getNetFlow(_acceptedToken, address(this));

        (, int96 outFlowRate, ,) = cfaV1Lib.cfa.getFlow(_acceptedToken, address(this), _receiver);

        int96 inFlowRate = netFlowRate + outFlowRate;

        if (inFlowRate == 0) {
            // The flow does exist and should be deleted.
            newCtx = cfaV1Lib.deleteFlowWithCtx(ctx, address(this), _receiver, _acceptedToken);
        } else if (outFlowRate != 0) {
            // The flow does exist and needs to be updated.
            newCtx = cfaV1Lib.updateFlowWithCtx(ctx, _receiver, _acceptedToken, inFlowRate);
        } else {
            // The flow does not exist but should be created.
            newCtx = cfaV1Lib.createFlowWithCtx(ctx, _receiver, _acceptedToken, inFlowRate);
        }
    }
}
