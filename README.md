# Smart Contract Lottery

This project demonstrates a smart contract based decentralized lottery created using solidity and Hardhat. It comes with the the Raffle solidity contract, a test suite for the contract, and a script that deploys the contract either on a local hardhat network or on a testnet.

## How the lottery works ?
1. Users enters the lottery by paying some amount greater than the minimum fee.
2. Chainlink keepers will be listening continuously to the contract and emitted events to perform the checks and choose a winner if criteria* is satisfied at a fixed trime interval.

*Criteria -> 
1. The fixed time interval should be passed
2. Lottery should have atleast 1 player
3. Our chainlink vrf subscription should be funded with some LINK
4. Lottery should be in 'OPEN' state


## Getting started
To get started, run the following commands:

```shell
npm i
``` 
-> Installs all the required dependencies for the hardhat project
```shell
npx hardhat compile
``` 
-> Compiles the contract
```shell
npx hardhat deploy
``` 
-> Deploys the contract
```shell
npx hardhat test
``` 
-> Runs the test suite for the contract


Note:
The project contains an .env.example for reference, the user will need to create an .env file using the example file as reference and add there own api key and private key entries in the same.

