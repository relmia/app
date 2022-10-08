# Boilerplate template for a project with hardhat, typescript, react, vite, and a subgraph

This is a template repository for the way I like to work with react and smart contracts on the ethereum blockchain.

It comes setup with a standard erc721 token contract by OpenZeppelin.

## Setup

Install all dependencies

    yarn install-all

Start the local chain

    yarn chain

Deploy the contract locally

    yarn deploy local

Start the frontend

    yarn start

Clean the graph node

    yarn clean-graph-node

Start the subgraph server (make sure Docker is running)

    yarn run-graph-node

Create a local subgraph

    yarn graph-create-local

Generate subraph code and deploy the local subgraph (you only need to do this once)

    yarn graph-ship-local
