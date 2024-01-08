import { useEffect, useState } from "react"

import Header from './components/Header'
import EnterRaffle from './components/EnterRaffle'


async function getMetamaskAccount(ethereum) {
  if (!ethereum) {
    alert("Please install metamask!!")
    return
  }

  // connect  metamask wallet
  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" })
    const account = accounts[0]
    return account
  } catch (error) {
    console.log(error);
  }
}

function App() {

  const { ethereum } = window
  const [account, setAccount] = useState(null)

  useEffect(() => {
    if (window.localStorage.getItem("connected")) {
      connectToMetamaskAccount()
    }

    const accountWasChanged = (accounts) => {
      console.log(accounts);
      if (!accounts[0]) {
        clearAccount()
      }
      setAccount(accounts[0])
      console.log("Account was changed");

    }

    const connectAccount = async () => {
      const res = await getMetamaskAccount()
      setAccount(res)
      console.log(`Connected to ${account}`);
    }

    const clearAccount = () => {
      setAccount(null)
      window.localStorage.removeItem("connected")
      console.log("Remove account");
    }

    ethereum.on('accountsChanged', accountWasChanged)
    ethereum.on('connect', connectAccount)
    ethereum.on('disconnect', clearAccount)

    return () => {
      ethereum.off('accountsChanged', accountWasChanged)
      ethereum.off('connect', connectAccount)
      ethereum.off('disconnect', clearAccount)
    }
  }, [])

  async function connectToMetamaskAccount() {
    const res = await getMetamaskAccount(ethereum)
    if (res) {
      setAccount(res)
      window.localStorage.setItem("connected", "true")
    }
  }

  return (
    <>
      <Header account={account} connectToMetamaskAccount={connectToMetamaskAccount} />
      <EnterRaffle account={account} />
    </>
  )
}

export default App
