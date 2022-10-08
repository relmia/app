pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {RedirectFlow, ISuperfluid} from "./RedirectFlow.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


import {
ISuperfluidToken
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";



/// @title Tradeable Cashflow NFT
/// @notice Inherits the ERC721 NFT interface from Open Zeppelin and the RedirectAll logic to
/// redirect all incoming streams to the current NFT holder.
contract TradeableFlow is ERC721, RedirectFlow {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    constructor(
        string memory _name,
        string memory _symbol,
        ISuperfluid host
    ) ERC721(_name, _symbol) RedirectFlow(host) {

    }

    function safeMint(address to, ISuperfluidToken acceptedToken, int96 flowRate) external {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _createInitialFlow(to, acceptedToken, flowRate);
    }


}
