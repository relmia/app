# Remlia - Decentralized Metaverse Billboard Protocol created for EthBogota

This is a repository for Remlia, a proof of concept hacked together at EthBogota 2022.
It contains an open-source smart contract for an ownable Metaverse Billboard, where
time can be auctioned off in real-time to creators or advertisers who want to show their
content on this billboard. The royalties get streamed directly to the owner of the billboard
in real-time using Superfluid.
The billboard is contained within a standard erc721 smart contract, meaning it can be sold
in any NFT marketplace. When the token changes owners, the revenues get instantly redirected
to the new owner.

The smart contract is a fork of the Superfluid [Tradeable Cash Flow example](https://github.com/superfluid-finance/super-examples/tree/main/examples/tradeable-cashflow). The difference between
this and that is that in this implementation, only one sender can be streaming to the contract
at a time. If someone else wants to stream to the contract, they must stream more than the
current person streaming, and if they do, the stream of the other person is stopped.

It uses LivePeer ids for video hosting; every add is linked to a livepeer id in the smart contract. This in the future could be generalized to images hosted on IPFS. The livepeer ids are passed to superfluid smart contract operations under `userData` and stored the current one is stored in the smart contract.

It also contains sample frontend code for what a bidding and rendering interface could look like.

## Useful bits of code

Here are some useful bits of code:

- [ERC721 hook](contracts/TradeableCashflow.sol#L27) that when a token is transfered, it redirects all revenues to the new owner.
- [Superfluid smart contract hook](contracts/BillboardFlow.sol#L167) that makes sure that a stream to the contract can only start if it has a greater flow than the currently running stream. If that's the case, then it stops the other stream.
- [Automated smart contract tests](test/app.test.ts#L225) that documents what the business logic of the contract.
- [React hooks for polling superfluids api](frontend/src/hooks/superfluid.ts) for streams and token balances.
- [Video player react component for live peer videos](frontend/src/billboardDisplays/FlatPagePlayer.tsx) that fetches the current live peer video id from the smart contract and renders its hls feed.

## Setup

Install all dependencies

    yarn install-all

Start the local chain

    yarn chain

Deploy the contract locally

    yarn deploy local

Start the frontend

    yarn start

Run smart contract tests

    yarn test
