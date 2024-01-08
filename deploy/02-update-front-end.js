const { deployments, network } = require("hardhat")
const fs = require("fs")

const FRONT_END_ADDRESS_FILE = "frontend/src/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "frontend/src/constants/abi.json"
module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Writing finished!!");
    }
}

const updateContractAddresses = async () => {
    const raffle = await deployments.get("Raffle")
    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address)) {
            currentAddresses[chainId].push(raffle.address)
        }
    } else {
        currentAddresses[chainId] = [raffle.address]
    }

    fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(currentAddresses))
}

const updateAbi = async () => {
    const raffle = await deployments.get("Raffle")
    fs.writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(raffle.abi))
}