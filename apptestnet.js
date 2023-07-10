const TelegramBot = require('node-telegram-bot-api');
const Web3 = require('web3');
const db = require('./conect');
const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');
const contract_unlocked_def = require('./creators/creatorDeflacionarioTEST');
const contract_locked_def = require('./creators/creatorDef_LockedTEST');
const walletInfo = require('./creators/msgsender');

const def_unlocked_creator = contract_unlocked_def.creatorUnlockedDef_CA;
const def_unlocked_ABI = contract_unlocked_def.creatorUnlockedDef_ABI;
const creatorUnlockedDef = new web3.eth.Contract(def_unlocked_ABI, def_unlocked_creator);

const def_locked_creator = contract_locked_def.creatorLockedDef_CA;
const def_locked_ABI = contract_locked_def.creatorLockedDef_ABI;
const creatorLockedDef = new web3.eth.Contract(def_locked_ABI, def_locked_creator);

const bot = new TelegramBot('5995542267:AAGLzl9CJRtQW_TXLuHpwy_lj3oTNc_EA2E', { polling: true });

const privateKey = walletInfo.privateKey;
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// Inicialize um objeto vazio para armazenar as informações do token
let tokenInfo = {};
let paymentInfo = {};
let userStatus = {};
let messageListenerId = {};
let language = {};
let typecreating = {};
let costforpay = {};

bot.onText(/\/tester/, (msg) => {
    const chatId = msg.chat.id;
    userStatus[chatId] = 'testehash';
    const user = userStatus[chatId];
    console.log(user);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Agora que todas as informações foram coletadas, envie uma mensagem ao usuário confirmando as informações e aguarde a confirmação
    const options_pt = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Selecionar Idioma - 🇺🇸 🇬🇧 🇧🇷 🇵🇹', callback_data: 'change_language' }],
                [{ text: 'Criar um Token', callback_data: 'new_contract' }],
                [{ text: 'Ir para documentação', url: `https://t.me/easytokensuport` }, { text: 'Painel Admin', callback_data: 'admin_panel' }],
                [{ text: 'F.A.Q.', callback_data: 'go_faq' }, { text: 'Ir ao site', url: `https://easytoken.app` }]
            ]
        })
    };

    const options_us = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Select Language - 🇺🇸 🇬🇧 🇧🇷 🇵🇹', callback_data: 'change_language' }],
                [{ text: 'Create Token', callback_data: 'new_contract' }],
                [{ text: 'Website', url: `https://easytoken.app` }, { text: 'Admin Panel', url: `https://easytoken.app/admin.php`}],
                //[{ text: 'Go to Docs', url: `https://t.me/easytokensuport` }, { text: 'Admin Panel', callback_data: 'admin_panel' }],
                //[{ text: 'F.A.Q.', callback_data: 'go_faq' }, { text: 'Website', url: `https://easytoken.app` }]
            ]
        })
    };

    if (language[chatId] === 'PT-br') {
        bot.sendMessage(msg.chat.id, `Bem vindo Easy Contracts\n\nA maneira mais fácil de criar um token, direto pelo telegram.\n\nVocê pode escolher o token que se enquadre no seu projeto.\nRealizar a criação dele aqui pelo bot.\nE configurar, mudar funções com um painel exclusivo ou pela BSCscan\n\nAlguns comandos que pode podem facilitar:\n\n/newcontract\nMostra opções de contratos para deploy.\n/Cancel\nCancela qualquer operação.\n/help\nMostra opções de ajuda.`, options_pt);

    } else {
        bot.sendMessage(msg.chat.id, `Welcome to Easy Contracts\n\nThe easiest way to create a token, right from telegram.\n\nYou can choose the token that fits your project.\nPerform the creation of it here by the bot.\nAnd configure, change functions with an exclusive panel or by BSCscan\n\nSome commands that may help:\n\n/newcontract\nShow contract options to deploy.\n/Cancel\nCancels any operation.\n/help\nShow help options.`, options_us);

    };


});

bot.on('polling_error', (error) => {
    console.log(error.code);
});

bot.onText(/\/cancel/, (msg) => {
    const chatId = msg.chat.id;
    if (userStatus[chatId]) {
        userStatus[chatId] = null;
        tokenInfo[chatId] = {};
        paymentInfo[chatId] = {};
        bot.removeTextListener(messageListenerId[chatId]);
        bot.sendMessage(chatId, 'A sua operação atual foi cancelada. Você pode iniciar uma nova operação a qualquer momento.');
    } else {
        bot.sendMessage(chatId, 'Você não tem nenhuma operação em andamento para ser cancelada.');
    }
});


//// COLETA INFORMAÇÕES PARA CRIAR O TOKEN
bot.on('message', async (msg) => {

    const chatId = msg.chat.id;
    if (userStatus[chatId] === 'collecting_info') {

        if (language[msg.chat.id] === 'PT-br') {
            if (!tokenInfo[chatId] || !tokenInfo[chatId].name) {
                tokenInfo[chatId] = { name: msg.text };
                bot.sendMessage(chatId, 'Por favor, insira o símbolo do token:');
            } else if (!tokenInfo[chatId].symbol) {
                tokenInfo[chatId].symbol = msg.text;
                bot.sendMessage(chatId, 'Por favor, insira a quantidade de decimais:');
            } else if (!tokenInfo[chatId].decimals) {
                const decimals = parseInt(msg.text, 10); // Convertendo a string para um número

                if (isNaN(decimals) || decimals < 1 || decimals > 18) {
                    bot.sendMessage(chatId, 'O número de decimais deve ser um numeral entre 1 e 18. Por favor, tente novamente.');
                } else {
                    tokenInfo[chatId].decimals = msg.text;
                    bot.sendMessage(chatId, 'Por favor, insira a quantidade inicial:');
                }
            } else if (!tokenInfo[chatId].initialSupply) {
                tokenInfo[chatId].initialSupply = msg.text;
                bot.sendMessage(chatId, 'Por favor, insira o endereço do proprietário:');
            } else if (!tokenInfo[chatId].ownerAddress) {
                const addressRegex = /^0x[a-fA-F0-9]{40}$/;

                if (!addressRegex.test(msg.text)) {
                    bot.sendMessage(chatId, 'O endereço fornecido não parece ser um endereço Ethereum válido. Por favor, tente novamente.');
                } else {
                    tokenInfo[chatId].ownerAddress = msg.text;
                    // Definindo um valor predefinido para o sexto parâmetro
                    tokenInfo[chatId].affiliate = '0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4';
                    // Agora que todas as informações foram coletadas, envie uma mensagem ao usuário confirmando as informações e aguarde a confirmação

                    const options = {
                        reply_markup: JSON.stringify({
                            inline_keyboard: [
                                [{ text: 'Confirmar', callback_data: 'confirm_create_token' }]
                            ]
                        })
                    };

                    bot.sendMessage(chatId, `⚠️ Confira os todos os dados antes de prossegurir.\n❕ Informações do token recebidas:\n\n➡️ Nome: ${tokenInfo[chatId].name}\n➡️ Símbolo: ${tokenInfo[chatId].symbol}\n➡️ Decimais: ${tokenInfo[chatId].decimals}\n➡️ Supply inicial: ${tokenInfo[chatId].initialSupply}\n➡️ Endereço do proprietário: ${tokenInfo[chatId].ownerAddress}\n`, options);
                }
            }
        } else {
            if (!tokenInfo[chatId] || !tokenInfo[chatId].name) {
                tokenInfo[chatId] = { name: msg.text };
                bot.sendMessage(chatId, 'Please enter token symbol:');
            } else if (!tokenInfo[chatId].symbol) {
                tokenInfo[chatId].symbol = msg.text;
                bot.sendMessage(chatId, 'Please enter the number of decimals:');
            } else if (!tokenInfo[chatId].decimals) {
                const decimals = parseInt(msg.text, 10); // Convertendo a string para um número

                if (isNaN(decimals) || decimals < 1 || decimals > 18) {
                    bot.sendMessage(chatId, 'The number of decimals must be a number between 1 and 18. Please try again.');
                } else {
                    tokenInfo[chatId].decimals = msg.text;
                    bot.sendMessage(chatId, 'Please enter the starting quantity:');
                }
            } else if (!tokenInfo[chatId].initialSupply) {
                tokenInfo[chatId].initialSupply = msg.text;
                bot.sendMessage(chatId, 'Please enter the owner address:');
            } else if (!tokenInfo[chatId].ownerAddress) {
                const addressRegex = /^0x[a-fA-F0-9]{40}$/;

                if (!addressRegex.test(msg.text)) {
                    bot.sendMessage(chatId, 'The address provided does not appear to be a valid Ethereum address. Please try again.');
                } else {
                    tokenInfo[chatId].ownerAddress = msg.text;
                    // Definindo um valor predefinido para o sexto parâmetro
                    tokenInfo[chatId].affiliate = '0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4';
                    // Agora que todas as informações foram coletadas, envie uma mensagem ao usuário confirmando as informações e aguarde a confirmação

                    const options = {
                        reply_markup: JSON.stringify({
                            inline_keyboard: [
                                [{ text: 'Confirm', callback_data: 'confirm_create_token' }]
                            ]
                        })
                    };

                    bot.sendMessage(chatId, `⚠️ Check all data before proceeding.\n❕ Token information received:\n\n➡️ Name: ${tokenInfo[chatId].name}\n➡️ Symbol: ${tokenInfo[chatId].symbol}\n➡️ Decimals: ${tokenInfo[chatId].decimals}\n➡️ Initial Supply: ${tokenInfo[chatId].initialSupply}\n➡️ Owner Address: ${tokenInfo[chatId].ownerAddress}\n`, options);
                }
            }
        }
    }


    if (userStatus[chatId] === 'awaiting_payment_hash') {

        if (!paymentInfo[chatId] || !paymentInfo[chatId].transactionHash) {
            paymentInfo[chatId] = { transactionHash: msg.text };
            userStatus[chatId] = 'awaiting_payment_confirmation';
            const hash = paymentInfo[chatId].transactionHash;




            // Se a consulta retornar algum resultado, a hash já está no banco de dados
            //if (typecreating[chatId] == 'create_unlocked') {
            //CONEXÃO COM BANCO DE DADOS
            db.getConnection(async (err, connection) => {
                if (err) throw err; // not connected!

                // Consulta para verificar se a hash já existe no banco de dados
                const checkQuery = `SELECT * FROM hashs WHERE value = ?`;

                connection.query(checkQuery, hash, async function (error, results, fields) {
                    // When done with the connection, release it.

                    // Handle error after the release.
                    if (error) throw error;

                    if (results.length < 0) {
                        bot.sendMessage(chatId, "Esta hash já foi utilizada. Por favor, forneça uma hash não utilizada.");
                        userStatus[chatId] = 'awaiting_payment_hash';
                        paymentInfo[chatId].transactionHash = null;
                    }
                    else {

                        //SE A HASH NAO TIVER SIDO UTILIZADA ADICIONA AO BANCO DE DADOS
                        try {
                            const transactionReceipt = await web3.eth.getTransactionReceipt(paymentInfo[chatId].transactionHash);
                            if (transactionReceipt && transactionReceipt.status) {
                                // Se a hash não está no banco de dados, inserir a nova hash

                                //CONFERE SE A HASH TEM O VALOR CORRETO PAGO
                                const transaction = await web3.eth.getTransaction(paymentInfo[chatId].transactionHash);
                                const paymentValueBNB = web3.utils.fromWei(transaction.value, 'ether'); // Converte de Wei para BNB

                                console.log(transaction.to.toLowerCase());
                                console.log(paymentValueBNB);
                                let costWei = costforpay[chatId];
                                let costBNB = web3.utils.fromWei(costWei, 'ether');
                                let deployerWallet = '0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4';
                                //confere o valor pago e carteira receptora
                                console.log(costBNB);
                                console.log(deployerWallet.toLowerCase());

                                if (paymentValueBNB === costBNB && transaction.to.toLowerCase() === deployerWallet.toLowerCase()) {

                                    if (language[msg.chat.id] === 'PT-br') {
                                        //deploy_unlocked_def
                                        if (typecreating[chatId] == 'create_Def_unlocked') {
                                            const deploy = {
                                                reply_markup: JSON.stringify({
                                                    inline_keyboard: [
                                                        [{ text: 'Deploy', callback_data: 'deploy_unlocked_def' }]
                                                    ]
                                                })
                                            };
                                            bot.sendMessage(chatId, 'Pagamento confirmado, prosseguindo com a criação do token...', deploy);
                                        } else if (typecreating[chatId] == 'create_Def_Locked') {
                                            const deploy = {
                                                reply_markup: JSON.stringify({
                                                    inline_keyboard: [
                                                        [{ text: 'Deploy', callback_data: 'deploy_Locked_def' }]
                                                    ]
                                                })
                                            };
                                            bot.sendMessage(chatId, 'Pagamento confirmado, prosseguindo com a criação do token...', deploy);
                                        }

                                    }
                                    else {
                                        if (typecreating[chatId] == 'create_Def_unlocked') {
                                            const deploy = {
                                                reply_markup: JSON.stringify({
                                                    inline_keyboard: [
                                                        [{ text: 'Deploy', callback_data: 'deploy_unlocked_def' }]
                                                    ]
                                                })
                                            };
                                            bot.sendMessage(chatId, 'Payment confirmed, proceeding with token creation...', deploy);
                                        }
                                        else if (typecreating[chatId] == 'create_Def_Locked') {
                                            const deploy = {
                                                reply_markup: JSON.stringify({
                                                    inline_keyboard: [
                                                        [{ text: 'Deploy', callback_data: 'deploy_Locked_def' }]
                                                    ]
                                                })
                                            };
                                            bot.sendMessage(chatId, 'Payment confirmed, proceeding with token creation...', deploy);
                                        }
                                    }
                                    //APÓS CONFIRMAR O VALOR PAGO PROSSEGUE COM A OPERAÇÃO
                                    // MUDA STATUS DO USUARIO PARA AGUARDANDO CREATE CONTRACT                                     
                                    userStatus[chatId] = 'awaiting_contract_create';
                                    const insertQuery = `INSERT INTO hashs (value) VALUES (?)`;

                                    connection.query(insertQuery, hash, function (error, results, fields) {
                                        // When done with the connection, release it.
                                        connection.release();

                                        // MUDA STATUS APRA HASH VERIFICADA
                                        if (error) throw error;
                                        console.log("Hash inserida com sucesso!");
                                        userStatus[chatId] = 'hashverified'
                                    });
                                    //ESTIMA TAXA DE GAS
                                    /**/

                                } else {
                                    if (language[msg.chat.id] === 'PT-br') {
                                        bot.sendMessage(chatId, 'O valor da transação não corresponde ao valor esperado. Por favor, envie uma hash válida');
                                    } else {
                                        bot.sendMessage(chatId, 'The transaction amount does not match the expected amount. Please check and try again..');
                                    }
                                    userStatus[chatId] = 'awaiting_payment_hash';
                                    paymentInfo[chatId].transactionHash = null;
                                }
                            } else {
                                // A transação com essa hash falhou, então não insira no banco de dados
                                if (language[msg.chat.id] === 'PT-br') {
                                    bot.sendMessage(chatId, 'A hash fornecida não é válida. Por favor, forneça uma hash válida.');
                                }
                                else {
                                    bot.sendMessage(chatId, 'The provided hash is not valid. Please provide a valid hash.');
                                }
                                userStatus[chatId] = 'awaiting_payment_hash';
                                paymentInfo[chatId].transactionHash = null;
                            }

                        } catch (error) {
                            // Houve um erro ao tentar obter o recibo da transação, então não insira no banco de dados
                            if (language[msg.chat.id] === 'PT-br') {
                                bot.sendMessage(chatId, 'Ocorreu um erro ao tentar verificar a hash. Por favor, envie uma nova hash.');
                            }
                            else {
                                bot.sendMessage(chatId, 'An error occurred while trying to verify the hash. Please try again.');
                            }
                            userStatus[chatId] = 'awaiting_payment_hash';
                            paymentInfo[chatId].transactionHash = null;
                        }
                    }
                });
            });
        }
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;

    if (action === 'confirm_create_token') {
        if (userStatus[chatId] !== 'collecting_info') {
            return;
        }
        console.log('teste1');

        if (typecreating[chatId] == 'create_Def_unlocked') {
            console.log('teste2');
            let costWei = await creatorUnlockedDef.methods.cost().call();
            let walletreceiver = '0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4';
            let costBNB = web3.utils.fromWei(costWei, 'ether');

            costforpay[chatId] = costWei;
            console.log(costforpay[chatId]);

            // Converte de Wei para BNB, levando em conta as 18 casas decimais
            userStatus[chatId] = 'awaiting_payment_hash';// status aguardando hash

            if (language[msg.chat.id] === 'PT-br') {
                bot.sendMessage(msg.chat.id, `Por favor, envie o pagamento de ${costBNB} BNB para o seguinte endereço de carteira: ${walletreceiver}\n Em seguida envie a hash de pagamento`);
            } else {
                bot.sendMessage(msg.chat.id, `Please send payment from ${costBNB} BNB to the following wallet address: ${walletreceiver}
            Then send the payment hash`);
            }
        }

        if (typecreating[chatId] == 'create_Def_Locked') {
            console.log('teste2B');
            let costWei = await creatorLockedDef.methods.cost().call();
            let walletreceiver = '0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4';
            let costBNB = web3.utils.fromWei(costWei, 'ether');


            costforpay[chatId] = costWei;
            console.log(costforpay[chatId]);
            // Converte de Wei para BNB, levando em conta as 18 casas decimais
            userStatus[chatId] = 'awaiting_payment_hash';// status aguardando hash

            if (language[msg.chat.id] === 'PT-br') {
                bot.sendMessage(msg.chat.id, `Por favor, envie o pagamento de ${costBNB} BNB para o seguinte endereço de carteira: 0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4\n Em seguida envie a hash de pagamento`);
            } else {
                bot.sendMessage(msg.chat.id, `Please send payment from ${costBNB} BNB to the following wallet address: 0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4
            Then send the payment hash`);
            }
        }
    }

    if (action === 'change_language') {
        const chatId = msg.chat.id;
        const options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '🇺🇸 🇬🇧 - English', callback_data: 'select_En' }],
                    [{ text: '🇧🇷 🇵🇹 - Português', callback_data: 'select_PT-br' }]
                ]
            })
        };
        // Obtenha o valor de custo do contrato
        bot.sendMessage(msg.chat.id, `Select your language\n\n`, options);


    }
    if (action === 'select_PT-br') {
        const chatId = msg.chat.id;

        language[chatId] = 'PT-br';

        const options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: 'Retornar', callback_data: 'return' }],
                ]
            })
        };
        bot.sendMessage(msg.chat.id, `✅ Português Selecionado `, options);
    }
    if (action === 'select_En') {
        const chatId = msg.chat.id;

        language[chatId] = 'En';

        const options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: 'Return', callback_data: 'return' }],
                ]
            })
        };
        bot.sendMessage(msg.chat.id, `✅ English selected `, options);
    }

    if (action === 'canceling') {
        const chatId = msg.chat.id;
        if (userStatus[chatId]) {
            userStatus[chatId] = null;
            tokenInfo[chatId] = {};
            paymentInfo[chatId] = {};
            bot.sendMessage(chatId, 'A sua operação atual foi cancelada. Você pode iniciar uma nova operação a qualquer momento.');
        } else {
            bot.sendMessage(chatId, 'Você não tem nenhuma operação em andamento para ser cancelada.');
        }
    }


    if (action === 'return') {
        const chatId = msg.chat.id;
        userStatus[chatId] = null;
        tokenInfo[chatId] = {};
        paymentInfo[chatId] = {}

        // Agora que todas as informações foram coletadas, envie uma mensagem ao usuário confirmando as informações e aguarde a confirmação
        const options_pt = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: 'Selecionar Idioma - 🇺🇸 🇬🇧 🇧🇷 🇵🇹', callback_data: 'change_language' }],
                    [{ text: 'Criar um Token', callback_data: 'new_contract' }],
                    [{ text: 'Ir para documentação', url: `https://t.me/easytokensuport` }, { text: 'Painel Admin', callback_data: 'admin_panel' }],
                    [{ text: 'F.A.Q.', callback_data: 'go_faq' }, { text: 'Ir ao site', url: `https://easytoken.app` }]
                ]
            })
        };

        const options_us = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: 'Select Language - 🇺🇸 🇬🇧 🇧🇷 🇵🇹', callback_data: 'change_language' }],
                    [{ text: 'Create Token', callback_data: 'new_contract' }],
                    [{ text: 'Website', url: `https://easytoken.app` }, { text: 'Admin Panel', url: `https://easytoken.app/admin.php`}],
                    //[{ text: 'Go to Docs', url: `https://t.me/easytokensuport` }, { text: 'Admin Panel', callback_data: 'admin_panel' }],
                   // [{ text: 'F.A.Q.', callback_data: 'go_faq' }, { text: 'Website', url: `https://easytoken.app` }]
                ]
            })
        };

        if (language[msg.chat.id] === 'PT-br') {
            bot.sendMessage(msg.chat.id, `Bem vindo Easy Contracts\n\nA maneira mais fácil de criar um token, direto pelo telegram.\n\nVocê pode escolher o token que se enquadre no seu projeto.\nRealizar a criação dele aqui pelo bot.\nE configurar, mudar funções com um painel exclusivo ou pela BSCscan\n\nAlguns comandos que pode podem facilitar:\n\n/newcontract\nMostra opções de contratos para deploy.\n/Cancel\nCancela qualquer operação.\n/help\nMostra opções de ajuda.`, options_pt);

        } else {
            bot.sendMessage(msg.chat.id, `Welcome to Easy Contracts\n\nThe easiest way to create a token, right from telegram.\n\nYou can choose the token that fits your project.\nPerform the creation of it here by the bot.\nAnd configure, change functions with an exclusive panel or by BSCscan\n\nSome commands that may help:\n\n/newcontract\nShow contract options to deploy.\n/Cancel\nCancels any operation.\n/help\nShow help options.`, options_us);

        };
    }

    if (action === 'deploy_Locked_def') {
        try {
            //se for um deflacionario unlocked                                            
            const gasPrice = await web3.eth.getGasPrice();

            console.log('gasPrice');
            const gasEstimate = await creatorLockedDef.methods.createToken(
                tokenInfo[chatId].name,
                tokenInfo[chatId].symbol,
                tokenInfo[chatId].decimals,
                tokenInfo[chatId].initialSupply,
                tokenInfo[chatId].ownerAddress,
                tokenInfo[chatId].affiliate
            ).estimateGas({
                from: account.address,
                value: costforpay[chatId]
            });
            console.log('indo criar');
            //INICIA A TRANSAÇÃO
            const transaction = creatorLockedDef.methods.createToken(
                tokenInfo[chatId].name,
                tokenInfo[chatId].symbol,
                tokenInfo[chatId].decimals,
                tokenInfo[chatId].initialSupply,
                tokenInfo[chatId].ownerAddress,
                tokenInfo[chatId].affiliate
            ).send({
                from: account.address,
                gasPrice: gasPrice,
                gas: gasEstimate,
                value: costforpay[chatId]
            });

            transaction.on('transactionHash', hash => {
                if (language[msg.chat.id] === 'PT-br') {
                    bot.sendMessage(msg.chat.id, `Transação enviada: ${hash}`);
                }
                else {
                    bot.sendMessage(msg.chat.id, `Transaction in Progess:\n Hash: ${hash}`);
                }
            });
            console.log('vai');
            transaction.on('receipt', receipt => {
                let event01 = receipt.events['TokenCreated'];
                let add = event01.address;
                console.log(add);
                console.log(event01);
                let tokenName = tokenInfo[chatId].name;
                let ownerWallet = tokenInfo[chatId].ownerAddress;
                let contractAddress = add;
                let ContractType = "Deflactionary";
                let ContractClass = "Locked";
                db.getConnection(async (err, connection2) => {
                    if (err) throw err; // not connected!


                    let insertQuery2 = `INSERT INTO TokenCreator (Wallet, Contract, Namebd, ContractType, ContractClass) VALUES (?, ?, ?, ?, ?)`;
                    let values2 = [ownerWallet, contractAddress, tokenName, ContractType, ContractClass];


                    connection2.query(insertQuery2, values2, function (error, results, fields) {
                        // When done with the connection, release it.
                        connection2.release();

                        // MUDA STATUS APRA HASH VERIFICADA
                        if (error) throw error;
                        console.log("Dados inseridos com sucesso!");
                    });
                });

                let btnStructure = {
                    inline_keyboard: [
                        [{ text: "BscScan", url: `https://testnet.bscscan.com/address/${event01.address}` }],
                        [{ text: "Admin Panel", url: `https://easytoken.app/admin.php` }]
                    ]
                };
                if (language[msg.chat.id] === 'PT-br') {
                    bot.sendMessage(chatId, `💥 Você criou seu token 💥\n Hash da transação: ${receipt.transactionHash}\n\nEndereço do contrato criado: ${event01.address}`, {
                        reply_markup: btnStructure
                    });
                } else {
                    bot.sendMessage(chatId, `💥 You created your token 💥\n Transaction Hash : ${receipt.transactionHash}\n\nCreated Contract Address: ${event01.address}`, {
                        reply_markup: btnStructure
                    });
                }
                userStatus[chatId] = null;
                tokenInfo[chatId] = {};
                paymentInfo[chatId] = {};
                messageListenerId[chatId] = {};
            });

            transaction.on('error', error => {
                messageListenerId[chatId] = {};
                let btnStructure2 = {
                    inline_keyboard: [
                        [{ text: "Support", url: `https://t.me/easytokensuport` }]
                    ]
                };
                if (language[msg.chat.id] === 'PT-br') {
                    bot.sendMessage(msg.chat.id, 'Ocorreu um erro durante a transação.\n\nFique tanquilo você não precisará pagar novamente apenas entre em contato com o suporte.', {
                        reply_markup: btnStructure2
                    });
                } else {
                    {


                        bot.sendMessage(msg.chat.id, 'There was an error during the transaction.\n\nYou not have to pay again, just contact support.', {
                            reply_markup: btnStructure2
                        });
                    }
                }
                console.error(error);
                userStatus[chatId] = null;
                tokenInfo[chatId] = {};
                paymentInfo[chatId] = {};
            });

        } catch (error) {
            let btnStructure3 = {
                inline_keyboard: [
                    [{ text: "Support", url: `https://t.me/easytokensuport` }]
                ]
            };
            if (language[msg.chat.id] === 'PT-br') {
                bot.sendMessage(msg.chat.id, 'Ocorreu um erro ao tentar enviar a transação. \n\nFique tanquilo você não precisará pagar novamente apenas entre em contato com o suporte.',
                    {
                        reply_markup: btnStructure3
                    });
            } else {
                {
                    bot.sendMessage(msg.chat.id, 'An error occurred while trying to send the transaction\n\nYou not have to pay again, just contact support.', {
                        reply_markup: btnStructure3
                    });
                }
            }
            console.error(error);
            userStatus[chatId] = null;
            tokenInfo[chatId] = {};
            paymentInfo[chatId] = {};

        }
    }

    if (action === 'deploy_unlocked_def') {
        try {
            //se for um deflacionario unlocked    
            console.log('vendo gas');
            const gasPrice = await web3.eth.getGasPrice();
            console.log('gasPrice');
            const gasEstimate = await creatorUnlockedDef.methods.createToken(
                tokenInfo[chatId].name,
                tokenInfo[chatId].symbol,
                tokenInfo[chatId].decimals,
                tokenInfo[chatId].initialSupply,
                tokenInfo[chatId].ownerAddress,
                tokenInfo[chatId].affiliate
            ).estimateGas({
                from: account.address,
                value: costforpay[chatId]
            });
            console.log('gas visto');
            //INICIA A TRANSAÇÃO
            const transaction = creatorUnlockedDef.methods.createToken(
                tokenInfo[chatId].name,
                tokenInfo[chatId].symbol,
                tokenInfo[chatId].decimals,
                tokenInfo[chatId].initialSupply,
                tokenInfo[chatId].ownerAddress,
                tokenInfo[chatId].affiliate
            ).send({
                from: account.address,
                gasPrice: gasPrice,
                gas: gasEstimate,
                value: costforpay[chatId]
            });

            transaction.on('transactionHash', hash => {
                if (language[msg.chat.id] === 'PT-br') {
                    bot.sendMessage(msg.chat.id, `Transação enviada: ${hash}`);
                }
                else {
                    bot.sendMessage(msg.chat.id, `Transaction in Progess:\n Hash: ${hash}`);
                }
            });

            transaction.on('receipt', receipt => {
                let event01 = receipt.events['TokenCreated'];
                let add = event01.address;
                let tokenName = tokenInfo[chatId].name;
                let ownerWallet = tokenInfo[chatId].ownerAddress;
                let contractAddress = add;
                let ContractType = "Deflactionary";
                let ContractClass = "Unlocked";
                db.getConnection(async (err, connection2) => {
                    if (err) throw err; // not connected!


                    let insertQuery2 = `INSERT INTO TokenCreator (Wallet, Contract, Namebd, ContractType, ContractClass) VALUES (?, ?, ?, ?, ?)`;
                    let values2 = [ownerWallet, contractAddress, tokenName, ContractType, ContractClass];


                    connection2.query(insertQuery2, values2, function (error, results, fields) {
                        // When done with the connection, release it.
                        connection2.release();

                        // MUDA STATUS APRA HASH VERIFICADA
                        if (error) throw error;
                        console.log("Dados inseridos com sucesso!");
                    });
                });

                let btnStructure = {
                    inline_keyboard: [
                        [{ text: "BscScan", url: `https://testnet.bscscan.com/address/${event01.address}` }],
                        [{ text: "Admin Panel", url: `https://easytoken.app/admin` }]
                    ]
                };
                if (language[msg.chat.id] === 'PT-br') {
                    bot.sendMessage(chatId, `💥 Você criou seu token 💥\n Hash da transação: ${receipt.transactionHash}\n\nEndereço do contrato criado: ${event01.address}`, {
                        reply_markup: btnStructure
                    });
                } else {
                    bot.sendMessage(chatId, `💥 You created your token 💥\n Transaction Hash : ${receipt.transactionHash}\n\nCreated Contract Address: ${event01.address}`, {
                        reply_markup: btnStructure
                    });
                }
                userStatus[chatId] = null;
                tokenInfo[chatId] = {};
                paymentInfo[chatId] = {};
                messageListenerId[chatId] = {};
            });

            transaction.on('error', error => {
                messageListenerId[chatId] = {};
                let btnStructure2 = {
                    inline_keyboard: [
                        [{ text: "Support", url: `https://t.me/easytokensuport` }]
                    ]
                };
                if (language[msg.chat.id] === 'PT-br') {
                    bot.sendMessage(msg.chat.id, 'Ocorreu um erro durante a transação.\n\nFique tanquilo você não precisará pagar novamente apenas entre em contato com o suporte.', {
                        reply_markup: btnStructure2
                    });
                } else {
                    {


                        bot.sendMessage(msg.chat.id, 'There was an error during the transaction.\n\nYou not have to pay again, just contact support.', {
                            reply_markup: btnStructure2
                        });
                    }
                }
                console.error(error);
                userStatus[chatId] = null;
                tokenInfo[chatId] = {};
                paymentInfo[chatId] = {};
            });

        } catch (error) {
            let btnStructure3 = {
                inline_keyboard: [
                    [{ text: "Support", url: `https://t.me/easytokensuport` }]
                ]
            };
            if (language[msg.chat.id] === 'PT-br') {
                bot.sendMessage(msg.chat.id, 'Ocorreu um erro ao tentar enviar a transação. \n\nFique tanquilo você não precisará pagar novamente apenas entre em contato com o suporte.',
                    {
                        reply_markup: btnStructure3
                    });
            } else {
                {
                    bot.sendMessage(msg.chat.id, 'An error occurred while trying to send the transaction\n\nYou not have to pay again, just contact support.', {
                        reply_markup: btnStructure2
                    });
                }
            }
            console.error(error);
            userStatus[chatId] = null;
            tokenInfo[chatId] = {};
            paymentInfo[chatId] = {};

        }
    }

    if (action === 'new_contract') {

        userStatus[chatId] = null;
        if (language[msg.chat.id] === 'PT-br') {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        // [{ text: 'Voltar ao ínicio', callback_data: 'return' }],
                        //[{ text: 'Create Basic', callback_data: 'Create_simple' }],
                        [{ text: '🔓 CONTRATOS SEM TRAVAS', callback_data: 'new_unsecure_contract' }],
                        [{ text: '🔒 CONTRATOS SEGUROS', callback_data: 'new_secure_contract' }],
                        // [{ text: '🚀 CONTRATOS HÍBRIDOS', callback_data: 'new_secure_contract' }],
                        [{ text: 'Ir para documentação', callback_data: 'go_docs' }],
                        [{ text: 'Voltar ao ínicio', callback_data: 'return' }, { text: 'Cancelar Tudo', callback_data: 'canceling' }]
                    ]
                })
            };
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `\nPara facilitar criamos classes de contratos de diferentes tipos.\nEscolha o tipo de contrato que se enquadra com seu projeto antes de escolher o contrato:\n\n🔒 CONTRATOS SEGURO:\n 🔘 Contratos com limitações ao owner (AntiRug)\n- Limitador de taxa máxima\n- Limitador de MaxWallet\n- Trade não pode ser travado\n- Inalterável pós renúncia.\n\n🔒 CONTRATOS DESTRAVADOS:\n 🔘 Contratos com mais liberdade ao OWNER\n- Possível subir taxas até 99%\n- MaxWallet\n- Trade pode ser Travado\n- Função Authorize para mudar taxas após renúncia\n- Função CoolDown\n`, options);
            //🚀 HÍBRIDO:\n 🔘 Contratos com todas Funções dos desbloqueados porém com uma função Anti-Rug que, ao ativada, o transforma em um contrato Seguro.
        } else {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '🔓 UNLOCKED CONTRACT', callback_data: 'new_unsecure_contract' }],
                        [{ text: '🔒 SAFE CONTRACTS', callback_data: 'new_secure_contract' }],
                        // [{ text: '🚀 HYBRID CONTRACTS', callback_data: 'new_secure_contract' }],
                        //[{ text: 'Go to docs', url: `https://t.me/easytokensuport` }],
                        [{ text: 'Return', callback_data: 'return' }, { text: 'Cancel', callback_data: 'canceling' }]
                    ]
                })
            };
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `\nTo make it easier, we created classes of contracts of different types.\nChoose the type of contract that fits your project before choosing the contract:\n\n🔒 SECURITY CONTRACTS:\n 🔘 Contracts with limitations to the owner (AntiRug)\n- Maximum rate limiter\n- No MaxWallet\n- Trade cannot be locked\n- Unchangeable after resignation.\n\n🔒 CONTRACTS UNLOCKED:\n 🔘 Contracts with more freedom to the OWNER\n- Possible to raise rates up to 99%\n- MaxWallet\n- Trade can be Locked\n- Authorize function to change rates after waiver\n- CoolDown Function\n`, options);
            //\n🚀 HYBRID:\n 🔘 Contracts with all Functions of unlocked but with an Anti- Rug which, when activated, turns it into a Safe contract.

        }
    }

    if (action === 'new_unsecure_contract') {

        typecreating[chatId] = 'create_unlocked';
        if (language[msg.chat.id] === 'PT-br') {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '🔥 DEFLACIONÁRIO', callback_data: 'Create_Def_unlock' }],
                        [{ text: '💰 RECOMPENSAS (EM BREVE)', callback_data: 'COMINGSOON' }],
                        [{ text: '📄 BÁSICO (EM BREVE)', callback_data: 'COMINGSOON' }],
                        [{ text: 'Voltar ao ínicio', callback_data: 'return' }, { text: 'Cancelar Tudo', callback_data: 'canceling' }]
                    ]
                })
            };
            userStatus[chatId] = null;
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `\nEscolha o tipo de contrato que deseja realizar o deploy:\n\n🔥 DEFLACIONÁRIO:\n - Token com queima automática\n\n💰 RECOMPENSAS:\n - Token com reflexão\n\n📄 BÁSICO:\n - Contrato simples com taxas`, options);
        } else {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '🔥 DEFLACTIONARY', callback_data: 'Create_Def_unlock' }],
                        //[{ text: '💰 REWARDS TOKEN (COMING SOON)', callback_data: 'COMINGSOON' }],
                       // [{ text: '📄 BASIC TOKEN (COMING SOON)', callback_data: 'COMINGSOON' }],
                        [{ text: 'Return', callback_data: 'return' }, { text: 'Cancel', callback_data: 'canceling' }]
                    ]
                })
            };
            userStatus[chatId] = null;
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `\nChoose the type of contract you want to deploy:\n\n🔥 DEFLATIONARY:\n - Token with automatic burning\n\n💰 REWARDS:\n - Token with reflection\n\n📄 BASIC:\n - Simple contract with fees`, options);
        }
    }


    if (action === 'new_secure_contract') {

        typecreating[chatId] = 'create_Locked';
        if (language[msg.chat.id] === 'PT-br') {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '🔥 DEFLACIONÁRIO', callback_data: 'Create_Locked_Def' }],
                        [{ text: '💰 RECOMPENSAS (EM BREVE)', callback_data: 'COMINGSOON' }],
                        [{ text: '📄 BÁSICO (EM BREVE)', callback_data: 'COMINGSOON' }],
                        [{ text: 'Voltar ao ínicio', callback_data: 'return' }, { text: 'Cancelar Tudo', callback_data: 'canceling' }]
                    ]
                })
            };
            userStatus[chatId] = null;
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `\nEscolha o tipo de contrato que deseja realizar o deploy:\n\n🔥 DEFLACIONÁRIO:\n - Token com queima automática\n\n💰 RECOMPENSAS:\n - Token com reflexão\n\n📄 BÁSICO:\n - Contrato simples com taxas`, options);
        } else {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '🔥 DEFLACTIONARY', callback_data: 'Create_Locked_Def' }],
                      //  [{ text: '💰 REWARDS TOKEN (COMING SOON)', callback_data: 'COMINGSOON' }],
                      //  [{ text: '📄 BASIC TOKEN (COMING SOON)', callback_data: 'COMINGSOON' }],
                        [{ text: 'Return', callback_data: 'return' }, { text: 'Cancel', callback_data: 'canceling' }]
                    ]
                })
            };
            userStatus[chatId] = null;
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `\nChoose the type of contract you want to deploy:\n\n🔥 DEFLATIONARY:\n - Token with automatic burning\n\n💰 REWARDS:\n - Token with reflection\n\n📄 BASIC:\n - Simple contract with fees`, options);
        }
    }


    if (action === 'Create_Def_unlock') {

        const chatId = msg.chat.id;
        userStatus[chatId] = null;
        tokenInfo[chatId] = {};
        paymentInfo[chatId] = {};

        typecreating[chatId] = 'create_Def_unlocked';
        ///TEXTO TOKEN UNLOCKED DEFLACIONARIO
        //********************************************************* */
        if (language[msg.chat.id] === 'PT-br') {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        //[{ text: 'Voltar ao ínicio', callback_data: 'return' }],
                        [{ text: 'Prosseguir com Deploy', callback_data: 'confirm_create_token_def' }],
                        [{ text: 'Escolher Outro contrato', callback_data: 'new_contract' }],
                        [{ text: 'Voltar ao ínicio', callback_data: 'return' }, { text: 'Cancelar Tudo', callback_data: 'canceling' }]
                    ]
                })
            };
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `🔥 CONTRATO DEFLACIONÁRIO SEM TRAVAS:\n\n🔘 Queima automática por transação\n🔘 Contrato é criado com trade travado\n🔘 Taxas indivíduais de Compra - Venda - Transferência\n🔘 Taxas para: QUEIMA - MARKETING - LIQUIDEZ - PROJETO \n\n⚠️Funções ONLYOWNER (Apenas OWNER pode usar).\n\n🔸 LAUNCH:\n - Libera o Trade. Este não pode ser mais travado\n🔸 AUTHORIZE / UNAUTHORIZE:\n - Autoriza ou Desautoriza Wallet ter acesso a funções do contrato memso após renúncia.\n\n⚠️Funções AUTHORIZED (Walets Autorizadas podem usar).\n\n🔹 SetFeeToSell:\n - Define taxas de Venda.\n🔹 SetFeeToTransfer:\n - Define taxas de Transferência.\n🔹 SetFeeTobuy:\n - Define taxas de Compra.\n🔹 SetIsExempt:\n - Abre exceção de taxas para carteiras adicionados.\n🔹 MaxWallet:\n - Define uma quantia máxima de tokens por Wallet.\n🔹 MaxWalletExempt:\n - Abre exceção de MaxWallet para carteiras adicionados.\n🔹Cooldown:\n -  Tempo minimo entre transações de uma mesma wallet.\n🔹 RecoverTokens:\n -  Recupera tokens enviados para o contrato.\n🔹 ManualSend:\n -  Recupera BNB que estiver no contrato.\n🔹 Renounce Ownership:\n -  Renuncia o Owner do Contrato.\n🔹 SetSwapBackSetings:\n -  Define quantia de tokens que o contrato vende da arrecadação de taxas.`, options);
        } else {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        //[{ text: 'Voltar ao ínicio', callback_data: 'return' }],
                        [{ text: 'Deploy Smart Contract', callback_data: 'confirm_create_token_def' }],
                        [{ text: 'Chose Other Contract', callback_data: 'new_contract' }],
                        [{ text: 'Return', callback_data: 'return' }, { text: 'Cancel', callback_data: 'canceling' }]
                    ]
                })
            };
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `🔥 🔥 DEFLATIONARY CONTRACT WITHOUT LOCKS:

            🔘 Automatic burning per transaction
            🔘 Contract is created with trade locked
            🔘 Individual Purchase - Sale - Transfer fees
            🔘 Rates for: BURNING - MARKETING - LIQUIDITY - PROJECT 
        
            ⚠️ONLYOWNER Functions (Only OWNER can use).
            
            🔸 LAUNCH:
             - Releases the Trade. This can no longer be locked
            🔸 AUTHORIZE / UNAUTHORIZE:
             - Authorizes or Deauthorizes Wallet to have access to contract functions even after resignation.
            
            ⚠️AUTHORIZED Functions (Authorized Wallets can use).
            
            🔹 SetFeeToSell :
             - Sets Selling fees.
            🔹 SetFeeToTransfer:
             - Sets Transfer fees.
            🔹 SetFeeTobuy:
             - Sets Buying fees.
            🔹 SetIsExempt:
             - Opens fee exception for added wallets .
            🔹 MaxWallet:
             - Defines a maximum amount of tokens per Wallet.
            🔹 MaxWalletExempt:
             - Opens MaxWallet exception for added wallets.
            🔹Cooldown:
             - Minimum time between transactions of the same wallet .
            🔹 RecoverTokens:
             - Retrieve tokens sent to the contract.
            🔹 ManualSend:
             - Retrieve BNB from the contract.
            🔹 Renounce Ownership:
             - Renounce Contract Ownership.
            🔹 SetSwapBackSetings :
             - Defines the amount of tokens that the contract sells from fee collection.`, options);
        }
    }

    if (action === 'Create_Locked_Def') {

        const chatId = msg.chat.id;
        userStatus[chatId] = null;
        tokenInfo[chatId] = {};
        paymentInfo[chatId] = {};
        typecreating[chatId] = 'create_Def_Locked';
        ///TEXTO TOKEN UNLOCKED DEFLACIONARIO
        //********************************************************* */
        if (language[msg.chat.id] === 'PT-br') {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        //[{ text: 'Voltar ao ínicio', callback_data: 'return' }],
                        [{ text: 'Prosseguir com Deploy', callback_data: 'confirm_create_token_def' }],
                        [{ text: 'Escolher Outro contrato', callback_data: 'new_contract' }],
                        [{ text: 'Voltar ao ínicio', callback_data: 'return' }, { text: 'Cancelar Tudo', callback_data: 'canceling' }]
                    ]
                })
            };
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `🔥 CONTRATO DEFLACIONÁRIO SEGURO:\n\n🔘 Queima automática por transação\n🔘 Taxas indivíduais de Compra - Venda - Transferência\n🔘 Taxas para: QUEIMA - MARKETING - LIQUIDEZ - PROJETO \n\n⚠️Funções ONLYOWNER (Apenas OWNER pode usar).\n\n🔹 SetFeeToSell:\n - Define taxas de Venda.\n🔹 SetFeeToTransfer:\n - Define taxas de Transferência.\n🔹 SetFeeTobuy:\n - Define taxas de Compra.\n🔹 MaxWallet:\n - Define uma quantia máxima de tokens por Wallet.\n🔹 RecoverTokens:\n -  Recupera tokens enviados para o contrato.\n🔹 ManualSend:\n -  Recupera BNB que estiver no contrato.\n🔹 Renounce Ownership:\n -  Renuncia o Owner do Contrato.\n🔹 SetSwapBackSetings:\n -  Define quantia de tokens que o contrato vende da arrecadação de taxas.`, options);
        } else {
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        //[{ text: 'Voltar ao ínicio', callback_data: 'return' }],
                        [{ text: 'Deploy Smart Contract', callback_data: 'confirm_create_token_def' }],
                        [{ text: 'Chose Other Contract', callback_data: 'new_contract' }],
                        [{ text: 'Return', callback_data: 'return' }, { text: 'Cancel', callback_data: 'canceling' }]
                    ]
                })
            };
            // Obtenha o valor de custo do contrato
            bot.sendMessage(msg.chat.id, `🔥 🔥 SAFE DEFLATIONARY CONTRACT:

            🔘 Automatic burning per transaction
            🔘 Individual Purchase - Sale - Transfer fees
            🔘 Rates for: BURNING - MARKETING - LIQUIDITY - PROJECT 
        
            ⚠️ONLYOWNER Functions (Only OWNER can use).
            
            🔹 SetFeeToSell :
             - Sets Selling fees.
            🔹 SetFeeToTransfer:
             - Sets Transfer fees.
            🔹 SetFeeTobuy:
             - Sets Buying fees.            
            🔹 MaxWallet:
             - Defines a maximum amount of tokens per Wallet.            
            🔹 RecoverTokens:
             - Retrieve tokens sent to the contract.
            🔹 ManualSend:
             - Retrieve BNB from the contract.
            🔹 Renounce Ownership:
             - Renounce Contract Ownership.
            🔹 SetSwapBackSetings :
             - Defines the amount of tokens that the contract sells from fee collection.`, options);
        }
    }

    if (action === 'confirm_create_token_def') {

        const chatId = msg.chat.id;

        if (userStatus[chatId] && userStatus[chatId] === 'awaiting_payment_confirmation') {
            if (language[msg.chat.id] === 'PT-br') {
                const options0 = {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{ text: 'Retornar', callback_data: 'return' }, { text: 'Cancelar', callback_data: 'canceling' }]
                        ]
                    })
                };
                bot.sendMessage(chatId, 'Você já tem uma operação em andamento.', options0);
            } else {
                const options0 = {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{ text: 'Retornar', callback_data: 'return' }, { text: 'Cancelar', callback_data: 'canceling' }]
                        ]
                    })
                };
                bot.sendMessage(chatId, 'ou already have an operation in progress.', options0);
            }
        } else {
            userStatus[chatId] = 'collecting_info';
            if (language[msg.chat.id] === 'PT-br') {
                bot.sendMessage(chatId, 'Por favor, insira o nome do token:');
            }
            else {
                bot.sendMessage(chatId, 'Please enter token name:');
            }
        }
    }
});