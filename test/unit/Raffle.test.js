const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", function () {
    let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
    const chainId = network.config.chainId

    beforeEach(async function () {
      await deployments.fixture(["all"])
      const raffleDeployment = await deployments.get("Raffle")
      raffle = await ethers.getContractAt(
        raffleDeployment.abi,
        raffleDeployment.address
      )

      const vrfCoordinatorV2MockDeployment = await deployments.get(
        "VRFCoordinatorV2Mock"
      )
      vrfCoordinatorV2Mock = await ethers.getContractAt(
        vrfCoordinatorV2MockDeployment.abi,
        vrfCoordinatorV2MockDeployment.address
      )

      raffleEntranceFee = await raffle.getEntranceFee()
      deployer = (await getNamedAccounts()).deployer
      interval = await raffle.getInterval()
    })

    describe("constructor", function () {
      it("Initializes Raffle correctly", async function () {
        const raffleState = await raffle.getRaffleState()
        assert.equal(raffleState.toString(), "0")
        assert.equal(interval.toString(), networkConfig[chainId]["interval"])
      })
    })

    describe("enterRaffle", function () {
      it("Reverts when you don't pay enough", async function () {
        await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
          raffle,
          "Raffle__NotEnoughEth"
        )
      })
      it("Records/adds players when they enter", async function () {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        const player = await raffle.getPlayer(0)
        assert.equal(player, deployer)
      })
      it("Emits event on entering", async function () {
        await expect(
          raffle.enterRaffle({ value: raffleEntranceFee })
        ).to.emit(raffle, "RaffleEnter")
      })
      it("Doesn't allow to enter when Raffle is calculating winner", async function () {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        await network.provider.send("evm_increaseTime", [
          Number(interval) + 1,
        ])
        await network.provider.send("evm_mine", [])
        // Pretend to be a chainlink keeper and call performUpKeep
        await raffle.performUpkeep(ethers.toUtf8Bytes(""))
        await expect(
          raffle.enterRaffle({ value: raffleEntranceFee })
        ).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen")
      })
    })

    describe("checkUpKeep", function () {
      it("Returns false if people haven't sent any ETH", async function () {
        await network.provider.send("evm_increaseTime", [
          Number(interval) + 1,
        ])
        await ethers.provider.send("evm_mine", [])
        const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
          ethers.toUtf8Bytes("")
        )
        assert(!upkeepNeeded)
      })
      it("Returns false is raffle isn't open", async function () {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        await network.provider.send("evm_increaseTime", [
          Number(interval) + 1,
        ])
        await ethers.provider.send("evm_mine", [])
        await raffle.performUpkeep("0x")
        const raffleState = await raffle.getRaffleState()
        const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
          ethers.toUtf8Bytes("")
        )
        assert.equal(raffleState.toString(), "1")
        assert(!upkeepNeeded)
      })
      it("Returns false if enough time hasn't passed", async () => {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        await network.provider.send("evm_increaseTime", [
          Number(interval) - 5,
        ]) // use a higher number here if this test fails
        await network.provider.request({ method: "evm_mine", params: [] })
        const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
        assert(!upkeepNeeded)
      })
      it("Returns true if enough time has passed, has players, eth, and is open", async () => {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        await network.provider.send("evm_increaseTime", [
          Number(interval) + 1,
        ])
        await network.provider.request({ method: "evm_mine", params: [] })
        const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
        assert(upkeepNeeded)
      })
    })

    describe("performUpKeep", function () {
      it("Only runs if checkUpKeep is true", async function () {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        await network.provider.send("evm_increaseTime", [
          Number(interval) + 1,
        ])
        await network.provider.request({ method: "evm_mine", params: [] })
        const tx = await raffle.performUpkeep("0x")
        assert(tx)
      })
      it("Reverts if checkUpKeep is false", async function () {
        await expect(
          raffle.performUpkeep("0x")
        ).to.be.revertedWithCustomError(raffle, "Raffle__UpkeepNotNeeded")
      })
      it("Updates raffle state, emits an event and calls vrfcoordinator random words function", async function () {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        await network.provider.send("evm_increaseTime", [
          Number(interval) + 1,
        ])
        await network.provider.request({ method: "evm_mine", params: [] })
        const tx = await raffle.performUpkeep("0x")
        const txnReceipt = await tx.wait(1)
        const requestId = txnReceipt.logs[1].args[0]
        const raffleState = await raffle.getRaffleState()
        assert(Number(requestId) > 0)
        assert(raffleState == 1)
      })
    })

    describe("fulfillRandomWords", function () {
      beforeEach(async function () {
        await raffle.enterRaffle({ value: raffleEntranceFee })
        await network.provider.send("evm_increaseTime", [
          Number(interval) + 1,
        ])
        await network.provider.request({ method: "evm_mine", params: [] })
      })

      it("Can only be called after performUpKeep", async function () {
        const address = await raffle.getAddress()
        await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, address)).to
          .be.reverted

        await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, address)).to
          .be.reverted
      })

      it("Picks a winner, resets the lottery and sends money to winner", async function () {
        const additionalEntrants = 3
        const startingAccount = 1 //deployer is 0th index
        const accounts = await ethers.getSigners()
        for (
          let i = startingAccount;
          i < startingAccount + additionalEntrants;
          i++
        ) {
          console.log(`Adding account no. ${i}`)
          await raffle
            .connect(accounts[i])
            .enterRaffle({ value: raffleEntranceFee })
        }

        const startingTimeStamp = await raffle.getLatestTimeStamp()
        let winnerStartingBalance

        // perform upkeep (mock being chainlink keeper -> consumer already added in deploy)
        // fulfillrandomwords (mock being the chainlink VRF)
        // We will have to wait for the fulfillrandomwords to be called -> on test net -> simulate locally

        await new Promise(async function (resolve, reject) {
          // once WinnerPicked event gets emitted
          raffle.once("WinnerPicked", async () => {
            console.log("Winner Picked Event emitted..")
            try {
              const recentWiner = await raffle.getRecentWinner()
              console.log(`Recent Winner: ${recentWiner}`)
              const raffleState = await raffle.getRaffleState()
              const lastTimeStamp = await raffle.getLatestTimeStamp()
              const numPlayers = await raffle.getNumberOfPlayers()
              const winnerEndingBalance = await ethers.provider.getBalance(
                accounts[1]
              )
              assert(numPlayers == 0)
              assert(raffleState == 0)
              assert(lastTimeStamp > startingTimeStamp)
              assert(
                winnerEndingBalance ==
                winnerStartingBalance +
                raffleEntranceFee * BigInt(additionalEntrants) +
                raffleEntranceFee
              )
              resolve()
            } catch (error) {
              reject(error)
            }
          })
          try {
            const tx = await raffle.performUpkeep("0x")
            const txnReceipt = await tx.wait(1)
            const address = await raffle.getAddress()
            console.log(await ethers.provider.getBalance(address))
            console.log("Calling fulfillRandomWords now...")
            winnerStartingBalance = await ethers.provider.getBalance(
              accounts[1]
            )
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txnReceipt.logs[1].args[0],
              address
            )
            console.log("Fulfill Random Words complete")
          } catch (error) {
            console.log(error)
          }
        })
      })
    })

    console.log(
      "\n---------------------------------------------------------------------------------------------------------\n"
    )
  })
