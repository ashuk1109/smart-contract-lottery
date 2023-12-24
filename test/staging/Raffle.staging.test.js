const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

/**
 * 1. Get subId for chainlink VRF and Fund
 * 2. Deploy our contract using the subId
 * 3. Register the contract with chainlink VRF & its subId
 * 4. Register the contract with Chainlink keepers
 * 5. Run staging test
 */


developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Staging Test", function () {
    let raffle, deployer, raffleEntranceFee

    beforeEach(async function () {
      const raffleDeployment = await deployments.get("Raffle")
      raffle = await ethers.getContractAt(
        raffleDeployment.abi,
        raffleDeployment.address
      )
      deployer = (await getNamedAccounts()).deployer
      console.log(deployer.address)
      raffleEntranceFee = await raffle.getEntranceFee()
    })

    describe("fulfillRandomWords", function () {
      it("Works with live chainlink keepers and VRF, we get a random winner", async function () {
        // enter the raffle
        const startingTimeStamp = await raffle.getLatestTimeStamp()
        const accounts = await ethers.getSigners()

        // setup listener before entering raffle
        await new Promise(async (res, rej) => {
          raffle.once("WinnerPicked", async () => {
            console.log("WinnerPicked event fired!!")
            try {
              const recentWiner = await raffle.getRecentWinner()
              const raffleState = await raffle.getRaffleState()
              const winnerEndingBalance = await ethers.provider.getBalance(
                accounts[0]
              )
              const endingTimeStamp = await raffle.getLatestTimeStamp()

              await expect(raffle.getPlayer(0)).to.be.reverted
              assert(recentWiner.toString() == accounts[0].address)
              assert(raffleState == 0)
              assert(
                winnerEndingBalance ==
                winnerStartingBalance + raffleEntranceFee
              )
              assert(endingTimeStamp > startingTimeStamp)
              res()
            } catch (error) {
              console.log(error)
              rej()
            }
          })

          const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
          const response = await tx.wait(1)
          const winnerStartingBalance = await ethers.provider.getBalance(
            accounts[0]
          )
        })
      })
    })
  })
