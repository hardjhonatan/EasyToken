module.exports = {
	creatorUnlockedDef_ABI: [
		{
			"inputs": [
				{
					"internalType": "string",
					"name": "_nametoken",
					"type": "string"
				},
				{
					"internalType": "string",
					"name": "_symboltoken",
					"type": "string"
				},
				{
					"internalType": "uint8",
					"name": "_decimais",
					"type": "uint8"
				},
				{
					"internalType": "uint256",
					"name": "_supplys",
					"type": "uint256"
				},
				{
					"internalType": "address",
					"name": "_owners",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "affiliate",
					"type": "address"
				}
			],
			"name": "createToken",
			"outputs": [
				{
					"internalType": "contract NXT",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "payable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "manualSend",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "Percentual",
					"type": "uint256"
				}
			],
			"name": "setAffiliatePercent",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "_costfordeploy",
					"type": "uint256"
				}
			],
			"name": "setcostforcontract",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "NewDev",
					"type": "address"
				},
				{
					"internalType": "bool",
					"name": "Active",
					"type": "bool"
				}
			],
			"name": "setIsNextDev",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"stateMutability": "nonpayable",
			"type": "constructor"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": false,
					"internalType": "address",
					"name": "tokenAddress",
					"type": "address"
				}
			],
			"name": "TokenCreated",
			"type": "event"
		},
		{
			"inputs": [],
			"name": "AffiliatePercent",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "ContractToken",
			"outputs": [
				{
					"internalType": "contract NXT",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "cost",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "adr",
					"type": "address"
				}
			],
			"name": "isNextDev",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		}
	],

	// A ABI do seu contrato
	creatorUnlockedDef_CA: '0xf2B0F810e5aFd7FCfFb1bCbaAaB3932912064899' // O endereço do seu contrato



}