import './App.css';
import { useState, Component, useEffect } from "react";
import Slider from "react-slick"
import "./slick.css"; 
import "./slick-theme.css";
import axios from 'axios';
import Web3 from 'web3';
import aws from 'aws-sdk'

class CustomSlide extends Component {
  constructor(props) {
    super(props)
    this.state = {
      count: 0
    }
  }
  render() {
    const {item, ...props} = this.props
    return (
      <div>
        <div className='Inner-slide-text'>{item[0]}</div>
        {this.state.count === 0 ? <img className='Inner-slide-image' src={item[1]} onClick={() => this.setState({count: 1})}>
        </img>
        :<div onClick={() => this.setState({count: 0})}>{item[2]}</div>
    }
      </div>
    )}
}

function App() {
  const [loadingPage, setLoadingPage] = useState(0)
  const [tab, setTap] = useState("NoneNFT")
  const [noneNFTItemList, setNoneNFTItemList] = useState("a")
  const [NFTItemList, setNFTItemList] = useState("a")
  const [activeSlide, setActiveSlide] = useState(0)
  const [account, setAccount] = useState("")
  const [contract, setContract] = useState("")
  const dummy = ''
  const [alert, setAlert] = useState("a")
  window.web3 = new Web3(window.ethereum);
  window.ethereum.enable();

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    beforeChange: (current, next) => setActiveSlide(next)
  }
  
  var renderSlide = ''

  useEffect(() => {
    if (noneNFTItemList !== "a") return;
    axios.post("http://localhost:3030/game2").then((res)=>{setNoneNFTItemList(res.data)
    getContractInstance()
    .then(response => {
      const contract = response
      window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(response => {
        setAccount(response[0])
        getNFTList(response[0], contract)
        .then(setAlert("b"))
      })
    })
  });
  }, [])

  var imageurl =''
  var nameOfWeapon=''
  var nonNFTList = []
  if (tab === 'NoneNFT') {
    if (NFTItemList !== []) {
      for (var i in NFTItemList) {
        for (var j in noneNFTItemList) {
          if (noneNFTItemList[j][0] === NFTItemList[i].name) {
            noneNFTItemList.splice(j, 1)
          }
        }
      }
      for (var i in noneNFTItemList) {
        nonNFTList.push({name: noneNFTItemList[i][0], imageurl: noneNFTItemList[i][1]})
      }
      renderSlide = nonNFTList.map(item => {
        return (
          <CustomSlide key={item.name} item={[item.name, item.imageurl, activeSlide]}></CustomSlide>
        )
      })
    }
    
  }
  else if (alert === "b") {
    
    renderSlide = NFTItemList.map(item => {
      return (
        <CustomSlide key={item.name} item={[item.name, item.url, item.stat,  activeSlide]}></CustomSlide>
      )
    })
  }
  
  function showNFT() {
    setTap('NFT')
  }

  function showNoneNFT() {
    setTap('NoneNFT')
  }

  async function getAccount() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    setAccount(accounts[0])
  }

  async function getContractInstance() {
    let contract;
    // Contract 불러오기 및 NFT 정보 확인
    await fetch('../abi/nft_abi.json')
    .then(response => response.json())
    .then(data => {
        //connect to NFTToken contract(Ropsten test network)
        let contract_abi = data;
        let contract_address = "0x0366f1f1143397Ee686EFCD083a4Ec20688E6073";
        contract = new window.web3.eth.Contract(contract_abi, contract_address)
        
    });
    return contract;
}

  async function getNFTList (account, contract) {
    
    const url = "http://localhost:3030/getItemInfo?public_key=" + account + "&game=" + "game2"
    const response = await axios.get(url)
    const contractA = await contract
    var nftURIList = []
    for (var i in response.data) {
      if (response.data[i].game === "game2") {
        var nftImgJSONUrl = await contractA.methods.getUri(response.data[i].img_token_id).call()
        var nftStatJSONUrl = await contractA.methods.getUri(response.data[i].stat_token_id).call()

        const nftimgJSON = await fetch(nftImgJSONUrl).then(response => response.json())

        const nftStatJSON = await fetch(nftStatJSONUrl).then(response => response.json())
        const nftstat = await fetch(nftStatJSON.url).then(response => response.json())
        
        nftURIList.push({name: response.data[i].name, url: nftimgJSON.url, stat: nftstat}) 
      }
      else {
        break
      }
    }
    setNFTItemList(nftURIList)
    setLoadingPage(1)
  }

  function mintNFT() {
    const selectedItem = noneNFTItemList[activeSlide]
    const url = "http://localhost:3000/game?name=" + selectedItem[0] + "&image=" + selectedItem[1] + "&stat=" + selectedItem[2] + "&game=" + selectedItem[3] + "&publicKey=" + account
    const link = document.createElement('a')
    link.href = url 
    link.click()
  }

  return (
    <div>
    {loadingPage === 0 ? <div className='Loading-page'></div> :
    <div className="App">
      <div className='Inventory'>
        <button className={`Inventory-button ${tab === 'NFT' ? 'active' : ''}`} onClick={showNFT}>NFT Item</button>
        <br></br>
        <button className={`Inventory-button ${tab === 'NoneNFT' ? 'active' : ''}`} onClick={showNoneNFT}>None NFT Item</button>
        <div className='Weapon-background'>
            <Slider {...settings}>
              {renderSlide}
            </Slider>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            {
            (function() {
              if(tab === "NoneNFT" ) return (<button onClick={mintNFT} className='Mint-button'>Mint NFT</button>)
            })()
            }
        </div>
      </div>
</div>}
</div>
  );
}

export default App;
