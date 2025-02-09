# HedgeHive Arbitrage Smart Contract

This repository contains the smart contract implementation for the HedgeHive project, submitted as part of the ETH Global Agentic Ethereum hackathon. HedgeHive is an AI-driven system that enables autonomous arbitrage within a decentralized orderbook.

## Overview

The HedgeHive Arbitrage Smart Contract allows anyone running an AI agent instance to autonomously perform arbitrage within the decentralized orderbook. This contract serves as the backbone for the arbitrage functionality in the HedgeHive ecosystem.

## Key Components

1. **Arbitrage.sol**: The main contract that handles the arbitrage logic and interactions with the 1inch Limit Order Protocol and Opium Protocol.

2. **Faucet.sol**: A helper contract that includes a mock ERC20 token (WETH) and a faucet for testing purposes.

3. **Arbitrage.ts**: A test file that demonstrates the usage of the Arbitrage contract and includes example scenarios.

## Features

- Integration with 1inch Limit Order Protocol for order execution
- Integration with Opium Protocol for derivative creation
- Callback functionality for interactive handling of maker assets
- Support for creating and minting derivative positions

## Testing

The repository includes a comprehensive test suite in `Arbitrage.ts`. This file demonstrates:

- Deployment of contracts
- Creation of limit orders
- Signing of orders
- Execution of arbitrage strategies

To run the tests, make sure you have Hardhat installed and configured, then run:

```
npx hardhat test
```

## Usage

The Arbitrage contract is designed to be used by AI agent instances within the HedgeHive ecosystem. It provides the necessary functionality for these agents to autonomously identify and execute arbitrage opportunities in the decentralized orderbook.

## Contributing

This project is part of the ETH Global Agentic Ethereum hackathon submission. While it's primarily for demonstration purposes, we welcome any suggestions or improvements.

## License

This project is licensed under the MIT License.

## Disclaimer

This project is a prototype developed for the ETH Global Agentic Ethereum hackathon. It is not intended for production use without further development and security audits.
