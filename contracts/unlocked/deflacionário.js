
bot.on('message', async (msg) => {

    const chatId = msg.chat.id;

    if (userStatus[chatId] === 'collecting_info') {
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
    }


    //
    if (userStatus[chatId] === 'awaiting_payment_hash') {

        //let costs = paymentInfo[chatId].cost;
        if (!paymentInfo[chatId] || !paymentInfo[chatId].transactionHash) {
            paymentInfo[chatId] = { transactionHash: msg.text };
            userStatus[chatId] = 'awaiting_payment_confirmation';
            //bot.sendMessage(chatId, `Informações`);
            const hash = paymentInfo[chatId].transactionHash;


            //CONEXÃO
            db.getConnection(async (err, connection) => {
                if (err) throw err; // not connected!

                // Consulta para verificar se a hash já existe no banco de dados
                const checkQuery = `SELECT * FROM hashs WHERE value = ?`;

                connection.query(checkQuery, hash, async function (error, results, fields) {
                    // When done with the connection, release it.

                    // Handle error after the release.
                    if (error) throw error;

                    // Se a consulta retornar algum resultado, a hash já está no banco de dados
                    if (results.length > 0) {
                        bot.sendMessage(chatId, "Esta hash já foi utilizada. Por favor, forneça uma hash não utilizada.");
                        userStatus[chatId] = 'awaiting_payment_hash';
                        paymentInfo[chatId].transactionHash = null;
                    } else {
                        try {
                            const transactionReceipt = await web3.eth.getTransactionReceipt(paymentInfo[chatId].transactionHash);
                            if (transactionReceipt && transactionReceipt.status) {// Se a hash não está no banco de dados, inserir a nova hash
                                const insertQuery = `INSERT INTO hashs (value) VALUES (?)`;

                                connection.query(insertQuery, hash, function (error, results, fields) {
                                    // When done with the connection, release it.
                                    connection.release();

                                    // Handle error after the release.
                                    if (error) throw error;
                                    console.log("Hash inserida com sucesso!");
                                    userStatus[chatId] = 'hashverified'
                                });

                                const transaction = await web3.eth.getTransaction(paymentInfo[chatId].transactionHash);
                                const paymentValueBNB = web3.utils.fromWei(transaction.value, 'ether'); // Converte de Wei para BNB
                                const yourWalletAddress = '0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4'; // Seu endereço de carteira
                                let costWei = await contract.methods.cost().call();
                                let costBNB = web3.utils.fromWei(costWei, 'ether'); // Converte de Wei para BNB, levando em conta as 18 casas decimais

                                if (paymentValueBNB === costBNB && transaction.to.toLowerCase() === yourWalletAddress.toLowerCase()) {
                                    bot.sendMessage(chatId, 'Pagamento confirmado, prosseguindo com a criação do token...');
                                    // Adicione aqui a chamada à função `createToken`

                                    userStatus[chatId] = 'awaiting_contract_create';
                                    try {
                                        const gasPrice = await web3.eth.getGasPrice();
                                        const gasEstimate = await contract.methods.createToken(
                                            tokenInfo[chatId].name,
                                            tokenInfo[chatId].symbol,
                                            tokenInfo[chatId].decimals,
                                            tokenInfo[chatId].initialSupply,
                                            tokenInfo[chatId].ownerAddress,
                                            tokenInfo[chatId].affiliate
                                        ).estimateGas({
                                            from: account.address,
                                            value: costWei
                                        });

                                        const transaction = contract.methods.createToken(
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
                                            value: costWei
                                        });

                                        transaction.on('transactionHash', hash => {
                                            bot.sendMessage(msg.chat.id, `Transação enviada: ${hash}`);
                                        });

                                        transaction.on('receipt', receipt => {
                                            bot.sendMessage(chatId, `Transação confirmada: ${receipt.transactionHash}`);
                                            userStatus[chatId] = null;
                                            tokenInfo[chatId] = {};
                                            paymentInfo[chatId] = {};
                                            messageListenerId[chatId] = {};
                                            bot.sendMessage(chatId, 'Você pode começar a criação de um novo token quando quiser, basta me enviar /newcontract');
                                        });

                                        transaction.on('error', error => {
                                            messageListenerId[chatId] = {};
                                            bot.sendMessage(msg.chat.id, 'Ocorreu um erro durante a transação.');
                                            console.error(error);
                                            userStatus[chatId] = null;
                                            tokenInfo[chatId] = {};
                                            paymentInfo[chatId] = {};
                                        });
                                    } catch (error) {
                                        bot.sendMessage(msg.chat.id, 'Ocorreu um erro ao tentar enviar a transação.');
                                        console.error(error);
                                        userStatus[chatId] = null;
                                        tokenInfo[chatId] = {};
                                        paymentInfo[chatId] = {};

                                    }

                                } else {
                                    bot.sendMessage(chatId, 'O valor da transação não corresponde ao valor esperado. Por favor, verifique e tente novamente.');
                                }
                            } else {
                                // A transação com essa hash falhou, então não insira no banco de dados
                                bot.sendMessage(chatId, 'A hash fornecida não é válida. Por favor, forneça uma hash válida.');
                                userStatus[chatId] = 'awaiting_payment_hash';
                                paymentInfo[chatId].transactionHash = null;
                            }

                        } catch (error) {
                            // Houve um erro ao tentar obter o recibo da transação, então não insira no banco de dados
                            bot.sendMessage(chatId, 'Ocorreu um erro ao tentar verificar a hash. Por favor, tente novamente.');
                            userStatus[chatId] = 'awaiting_payment_hash';
                            paymentInfo[chatId].transactionHash = null;
                        }
                    }
                });
            });
            if (userStatus[chatId] === 'hashverified') {
                try {
                    const transactionReceipt = await web3.eth.getTransactionReceipt(paymentInfo[chatId].transactionHash);
                    if (transactionReceipt && transactionReceipt.status) {
                        const transaction = await web3.eth.getTransaction(paymentInfo[chatId].transactionHash);
                        const paymentValueBNB = web3.utils.fromWei(transaction.value, 'ether'); // Converte de Wei para BNB
                        const yourWalletAddress = '0xc4c5A10fCc1631c32D0191b7754b113E3A26E5e4'; // Seu endereço de carteira
                        let costWei = await contract.methods.cost().call();
                        let costBNB = web3.utils.fromWei(costWei, 'ether'); // Converte de Wei para BNB, levando em conta as 18 casas decimais

                        if (paymentValueBNB === costBNB && transaction.to.toLowerCase() === yourWalletAddress.toLowerCase()) {
                            bot.sendMessage(chatId, 'Pagamento confirmado, prosseguindo com a criação do token...');
                            // Adicione aqui a chamada à função `createToken`

                            userStatus[chatId] = 'awaiting_contract_create';
                            try {
                                const gasPrice = await web3.eth.getGasPrice();
                                const gasEstimate = await contract.methods.createToken(
                                    tokenInfo[chatId].name,
                                    tokenInfo[chatId].symbol,
                                    tokenInfo[chatId].decimals,
                                    tokenInfo[chatId].initialSupply,
                                    tokenInfo[chatId].ownerAddress,
                                    tokenInfo[chatId].affiliate
                                ).estimateGas({
                                    from: account.address,
                                    value: costWei
                                });

                                const transaction = contract.methods.createToken(
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
                                    value: costWei
                                });

                                transaction.on('transactionHash', hash => {
                                    bot.sendMessage(msg.chat.id, `Transação enviada: ${hash}`);
                                });

                                transaction.on('receipt', receipt => {
                                    bot.sendMessage(chatId, `Transação confirmada: ${receipt.transactionHash}`);
                                    userStatus[chatId] = null;
                                    tokenInfo[chatId] = {};
                                    paymentInfo[chatId] = {};
                                    messageListenerId[chatId] = {};
                                    bot.sendMessage(chatId, 'Você pode começar a criação de um novo token quando quiser, basta me enviar /newcontract');
                                });

                                transaction.on('error', error => {
                                    messageListenerId[chatId] = {};
                                    bot.sendMessage(msg.chat.id, 'Ocorreu um erro durante a transação.');
                                    console.error(error);
                                    userStatus[chatId] = null;
                                    tokenInfo[chatId] = {};
                                    paymentInfo[chatId] = {};
                                });
                            } catch (error) {
                                bot.sendMessage(msg.chat.id, 'Ocorreu um erro ao tentar enviar a transação.');
                                console.error(error);
                                userStatus[chatId] = null;
                                tokenInfo[chatId] = {};
                                paymentInfo[chatId] = {};

                            }

                        } else {
                            bot.sendMessage(chatId, 'O valor da transação não corresponde ao valor esperado. Por favor, verifique e tente novamente.');
                        }
                    } else {
                        bot.sendMessage(chatId, 'A transação falhou ou ainda não foi confirmada. Por favor, verifique e tente novamente.');
                    }
                } catch (error) {
                    bot.removeTextListener(messageListenerId[chatId]);
                    bot.sendMessage(chatId, 'Ocorreu um erro ao tentar verificar a transação.');
                    console.error(error);
                    userStatus[chatId] = null;
                    tokenInfo[chatId] = {};
                    paymentInfo[chatId] = {};
                }
            }



            // Agora que temos o hash da transação, podemos verificar a transação...

        }
    }
});