import { useEffect, useState } from "react"
import { Web3 } from "web3"
import abi from "../constants/abi.json"
import addresses from "../constants/contractAddresses.json"


function EnterRaffle({ account }) {

    const address = addresses[31337][0]
    // const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545")
    const web3 = new Web3(window.ethereum)
    const contract = new web3.eth.Contract(
        abi,
        address
    )
    const [entranceFee, setEntranceFee] = useState(0)
    const [numberOfPlayers, setNumberOfPlayers] = useState(0)
    const [recentWinner, setRecentWinner] = useState("")

    async function enterRaffle() {
        try {
            const res = await contract.methods.enterRaffle().send({
                from: account,
                value: entranceFee,
            })
            alert("Lottery entrance successful!!")
            console.log(res);

            await getNumberOfPlayers()
        } catch (error) {
            console.log(error);
        }
    }

    async function getNumberOfPlayers() {
        const numberOfPlayers = await contract.methods.getNumberOfPlayers().call()
        setNumberOfPlayers(parseInt(numberOfPlayers))
    }

    async function getEntranceFee() {
        const res = await contract.methods.getEntranceFee().call()
        setEntranceFee(parseInt(res))
    }

    async function getRecentWinner() {
        const res = await contract.methods.getRecentWinner().call()
        setRecentWinner(res)
    }

    useEffect(() => {
        getEntranceFee()
        getRecentWinner()
        getNumberOfPlayers()
    }, [])

    return (
        <div>
            {account ?
                <>
                    <button className='btn raffle' onClick={enterRaffle}>Enter Raffle</button>
                    <p>Entrance fee: {entranceFee} ETH</p>
                    <p>Number of players: {numberOfPlayers}</p>
                    <p>Recent Winner : {recentWinner}</p>
                </>
                : <p>Please connect your Metamask account to enter Lottery</p>}
        </div>
    )
}

export default EnterRaffle