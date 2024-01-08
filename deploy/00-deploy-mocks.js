const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.parseEther("0.25") // Premium per request -> It costs 0.25 LINK per request
const GAS_PRICE_LINK = 1e9 // calculated value based on gasPrice of the chain
// Chainlink nodes pay the gas fees to give us randomness and do extenal execution
// so if say eth price fluctuates, miners need to pay that, hence this is fluctuating value based on gas price on chain

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  if (developmentChains.includes(network.name)) {
    log("Local network detected, deploying Mocks...")

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    })

    log("Mocks Deployed!!")
    log(
      "\n---------------------------------------------------------------------------------------------------------\n"
    )
  }
}

module.exports.tags = ["all", "mock"]
