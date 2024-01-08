import "./Header.css"




function Header({ account, connectToMetamaskAccount }) {

    return (
        <div className="flex-header">
            <h1>Decentralized Lottery</h1>
            {!account ? <button className="btn metamask" onClick={connectToMetamaskAccount}>Connect Wallet</button> :
                <button className="btn">Connected to metamask!!</button>}
        </div>
    )
}

export default Header