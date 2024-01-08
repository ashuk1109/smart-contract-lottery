
const { ethers, deployments } = require("hardhat")

async function mockKeepers() {
    console.log(deployments);
    const raffleDeployment = await deployments.get("Raffle")
    const raffle = await ethers.getContractAt(
        raffleDeployment.abi,
        raffleDeployment.address
    )
    const checkData = ethers.keccak256(ethers.toUtf8Bytes(""))
    const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(checkData)
    if (upkeepNeeded) {
        const tx = await raffle.performUpkeep(checkData)
        const txnReceipt = await tx.wait(1)
        const requestId = txnReceipt.events[1].args.requestId
        console.log(`Performed upkeep with RequestId: ${requestId}`);
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffle.address)
        console.log("Responded!")
        const recentWinner = await raffle.getRecentWinner()
        console.log(`The winner is: ${recentWinner}`)
    }
}

mockKeepers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })