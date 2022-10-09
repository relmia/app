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
//    address sender;
   int96 flow;
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

    address internal _winningBidSender;

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

        _winningBid.flow = 0;

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

    function _updateCurrentWinningBid(address sender, int96 _winningBidFlow) internal {
        _winningBidSender = sender;
        _winningBid.flow = _winningBidFlow;
    
        console.log("updated winning bid");
        console.logInt(_winningBid.flow);
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
        newCtx = _ctx;
        // get the newly created flow's rate
        (, int96 newAgreementFlowRate, ,) = cfaV1Lib.cfa.getFlowByID(_superToken, _agreementId);
        // if there is a current winning bid
       (address sender,) = abi.decode(_agreementData, (address,address));
        if (_winningBid.flow > 0)  {
            // if the new flow rate is less than the current bid flow rate reject it
            if (newAgreementFlowRate <= _winningBid.flow) {
                revert("New flow rate is lass than current winning flow rate");
            } 
             
            // console.log("NEW FLOW RATE");
            console.logInt(newAgreementFlowRate);
            console.log(_winningBidSender);
            // for some reason deletion is leading to issues
            newCtx = cfaV1Lib.createFlowWithCtx(newCtx, _winningBidSender, _acceptedToken, _winningBid.flow);
            _updateCurrentWinningBid(sender, newAgreementFlowRate);
            newCtx = cfaV1Lib.updateFlowWithCtx(newCtx, _receiver, _acceptedToken, newAgreementFlowRate);
            int96 netFlowRate = cfaV1Lib.cfa.getNetFlow(_acceptedToken, address(this));
            console.logInt(netFlowRate);
            return newCtx;
        } 

        _updateCurrentWinningBid(sender, newAgreementFlowRate);
        return cfaV1Lib.createFlowWithCtx(newCtx, _receiver, _acceptedToken, newAgreementFlowRate);
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
        (, int96 updatedAgreementFlowRate, ,) = cfaV1Lib.cfa.getFlowByID(_superToken, _agreementId);
        (address sender,) = abi.decode(_agreementData, (address,address));

        _updateCurrentWinningBid(sender, updatedAgreementFlowRate);

        return cfaV1Lib.updateFlowWithCtx(_ctx, _receiver, _acceptedToken, updatedAgreementFlowRate);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        // According to the app basic law, we should never revert in a termination callback
        console.log("TERMINATED FN");
        if (_superToken != _acceptedToken || _agreementClass != address(cfaV1Lib.cfa)) {
            return _ctx;
        }

        (address sender,) = abi.decode(_agreementData, (address,address));
        if (sender == _winningBidSender) {
            // set as if there is no winning bid if the one deleted is the current winning bid.
            _winningBid.flow = 0;
        }


        (, int96 inverseFlowRate, ,) = cfaV1Lib.cfa.getFlow(_acceptedToken, address(this), sender);


        newCtx = _ctx;
        newCtx = cfaV1Lib.deleteFlowWithCtx(newCtx , address(this), _receiver, _acceptedToken);
        // here we delete the inverse flow if there was one created before.  we had to create it
        // becuase for some reason deletion was causting an error
        if (inverseFlowRate != 0)
           newCtx = cfaV1Lib.deleteFlowWithCtx(newCtx , _receiver, address(this), _acceptedToken);
    
        return newCtx;
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
    // function _updateOutflow(bytes memory ctx) private returns (bytes memory newCtx) {
    //     console.log("CALL UPDTATE OUTFLOW");
    //     newCtx = ctx;

    //     (, int96 outFlowRate, ,) = cfaV1Lib.cfa.getFlow(_acceptedToken, address(this), _receiver);

    //     console.log("got da flow");

    //     if (_winningBid.flow == 0 && outFlowRate != 0) {
    //         console.log("DELETE OUT");
    //         newCtx = cfaV1Lib.deleteFlowWithCtx(newCtx, address(this), _receiver, _acceptedToken);
    //     } else if (outFlowRate != 0) {
    //         console.log("UPDATE OUT");
    //         console.logInt(_winningBid.flow);
    //         newCtx = cfaV1Lib.updateFlowWithCtx(newCtx, _receiver, _acceptedToken, _winningBid.flow);
            

    //         (, int96 outFlowRate, ,) = cfaV1Lib.cfa.getFlow(_acceptedToken, address(this), _receiver);
    //         console.log("UPDTATED OUT");
    //         console.logInt(outFlowRate);
    //         // newCtx = cfaV1Lib.updateFlowWithCtx(newCtx, _receiver, _acceptedToken, );
    //     } else {
    //         // The flow does not exist but should be created.
    //         console.log("CREATE OUT");
    //         newCtx = cfaV1Lib.createFlowWithCtx(newCtx, _receiver, _acceptedToken, _winningBid.flow);

    //     }
    // }
}
