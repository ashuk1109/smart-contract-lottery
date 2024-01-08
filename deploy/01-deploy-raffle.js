const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

const VRF_SUB_FUND_AMOUNT = 10

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock

  if (developmentChains.includes(network.name)) {
    // local network
    const vrfCoordinatorV2MockDeployment = await deployments.get(
      "VRFCoordinatorV2Mock"
    )
    vrfCoordinatorV2Address = vrfCoordinatorV2MockDeployment.address
    vrfCoordinatorV2Mock = await ethers.getContractAt(
      vrfCoordinatorV2MockDeployment.abi,
      vrfCoordinatorV2Address
    )
    const txnResponse = await vrfCoordinatorV2Mock.createSubscription()
    const txnReceipt = await txnResponse.wait(1)
    subscriptionId = txnReceipt.logs[0].args[0]
    // To fund the subscription, on test/real network, we need to link token
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      ethers.parseEther("30")
    )
  } else {
    // testnet
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
    subscriptionId = networkConfig[chainId]["subscriptionId"]
  }

  const entranceFee = networkConfig[chainId]["entranceFee"]
  const gasLane = networkConfig[chainId]["gasLane"]
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
  const interval = networkConfig[chainId]["interval"]
  const arguments = [
    entranceFee,
    vrfCoordinatorV2Address,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    "1",
  ]
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  log(
    "\n---------------------------------------------------------------------------------------------------------\n"
  )

  if (developmentChains.includes(network.name)) {
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
    log("Consumer Added")
  }
}

module.exports.tags = ["all", "raffle"]
