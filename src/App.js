import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import osLogo from "./assets/opensea.png"
import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json';
import LoadingIndicator from "./components/LoadingIndicator/index"

// Constants
const TWITTER_HANDLE = 'Devlyn_3';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-baxrhdpqod';
const TOTAL_MINT_COUNT = 32;
const CONTRACT_ADDRESS = "0xAC873D4350174c115A7c703ef0523A63e069b192";


const App = () => {
	const [currentAccount, setCurrentAccount] = useState("");
	const [contract, setContract] = useState(null);
	const [numMinted, setNumMinted] = useState(-1);
	const [loadingMint, setLoadingMint] = useState(false);
    
  const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
				console.log("Make sure you have metamask!");
				return;
		} else {
				console.log("We have the ethereum object", ethereum);
		}

		let chainId = await ethereum.request({ method: 'eth_chainId' });
		console.log("Connected to chain " + chainId);

		// String, hex code of the chainId of the Rinkebey test network
		const rinkebyChainId = "0x4"; 
		if (chainId !== rinkebyChainId) {
			alert("You are not connected to the Rinkeby Test Network!");
			return;
		}	

		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
				const account = accounts[0];
				console.log("Found an authorized account:", account);
				setCurrentAccount(account)
		} else {
				console.log("No authorized account found")
		}
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

	// Grab the contract
	useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicNft.abi,
        signer
      );

      setContract(contract);
			console.log("Found the contract!")
    } else {
      console.log('Ethereum object not found');
    }
  }, []);

	useEffect(() => {
		const getCurrentMinted = async () => {
			let numMinted = await contract.getNumMinted();
			setNumMinted(numMinted.toNumber());
			console.log("Current number of NFTs minted = " + numMinted);
		}

		if(contract && currentAccount){
			getCurrentMinted();
		}

	}, [contract, currentAccount])

	useEffect(() => {
		const onNewMint = (from, tokenId) => {
			console.log(from, tokenId.toNumber())
			setNumMinted(prevCount => prevCount + 1)

			if(from.toUpperCase() === currentAccount.toUpperCase()){
				setLoadingMint(false);
				alert(`Hey there! We've minted your NFT. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: <https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`)
			}
		}

    if (contract && currentAccount) {
      contract.on("NewEpicNFTMinted", onNewMint)
    }

    return () => {
      if (contract) {
        contract.off('NewEpicNFTMinted', onNewMint);
      }
    }
  }, [contract, currentAccount]);

	const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

			let chainId = await ethereum.request({ method: 'eth_chainId' });
			console.log("Connected to chain " + chainId);

			// String, hex code of the chainId of the Rinkebey test network
			const rinkebyChainId = "0x4"; 
			if (chainId !== rinkebyChainId) {
				alert("You are not connected to the Rinkeby Test Network!");
				return;
			}	

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

	const askContractToMintNft = async () => {
		try{
      if (contract) {
				setLoadingMint(true);
        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await contract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();
        
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      }
    } catch (error) {
			setLoadingMint(false);
      console.log(error)
    }
	}

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Classic Collection Names</p>
          <p className="sub-text">
						A 2021 NFT time capsule: <i>Number Adjective Animal</i>
          </p>
					{currentAccount === "" ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
              Connect to Wallet
            </button>
          ) : (
            <button onClick={askContractToMintNft} className="cta-button connect-wallet-button" disabled={loadingMint}>
              {loadingMint ? "Mint in Progress..." : "Mint NFT"}
            </button>
          )}
					{currentAccount && (numMinted >= 0 && !loadingMint ? (<p className="sub-text">{numMinted}/32 Minted So Far!</p>) : 
					<div style={{margin: "25px 0px"}}><LoadingIndicator/></div>)}
        </div>
        <div className="footer-container">
					<div className="icon-link">
						<img alt="OpenSea Logo" className="logo" src={osLogo} />
						<a
							className="footer-text"
							href={OPENSEA_LINK}
							target="_blank"
							rel="noreferrer"
						>{`View Collection on Opensea`}</a>
					</div>
					<div className="icon-link">
						<img alt="Twitter Logo" className="logo" src={twitterLogo} />
						<a
							className="footer-text"
							href={TWITTER_LINK}
							target="_blank"
							rel="noreferrer"
						>{`Built by @${TWITTER_HANDLE} w/ Buildspace`}</a>
					</div>
        </div>
      </div>
    </div>
  );
};

export default App;
