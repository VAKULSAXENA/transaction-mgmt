const { ethers, Wallet } = require('ethers');
const fetch = require("node-fetch");
const sleep = ms => new Promise(res => setTimeout(res, ms));

const privatekey = '3aaf25724408ee89faa2d191db1bee758a3a9b3288a6177294f027292fdec3bc';

const provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/1cd780d3ab7b4afbac02ab582852fa39');
const wallet = new ethers.Wallet(privatekey, provider);
const signer = wallet.connect(provider);

async function call() {
    const recipient = "0xdf39474cB1b8dC106b3636B1d854d4dE0Df446e4";
    const max_round = 3;
    let round_count = 1;

    const gas_resp = await fetch('https://gasstation-mumbai.matic.today/v2')
    const gas = await gas_resp.json();
    // const gasPrice = parseInt((gas.fast.maxFee) * 1e9);
    const gasPrice = parseInt((1) * 1e8); //only for testing

    async function tx_call(_gasPrice) {
        const tx = {
            from: wallet.address,
            to: recipient,
            value: ethers.utils.parseUnits('0.001', 'ether'),
            gasPrice: _gasPrice,
            gasLimit: ethers.utils.hexlify(50000),
            nonce: provider.getTransactionCount(wallet.address, 'latest')
        };

        console.log('tx sent with gas: ', _gasPrice);
        const transaction = await signer.sendTransaction(tx);
        
        const tx_hash = transaction.hash.toString();
        console.log('tx hash: ', tx_hash)
        console.log('checking status....')
        await sleep(20000)

        const receipt = await provider.getTransactionReceipt(tx_hash)

        if (receipt != null) {
            console.log('tx status is success')
        }

        else if (receipt == null) {
            console.log('tx status is pending');
            const gas_resp = await fetch('https://gasstation-mumbai.matic.today/v2')
            const gas = await gas_resp.json();
            const gasPrice = parseInt((gas.fast.maxFee) * 1e9);
            // const gasPrice = parseInt((1 + round_count) * 1e8);  //only for testing

            if (round_count < max_round) {
                round_count = round_count + 1;
                console.log('round: ', round_count)
                tx_call(gasPrice)
            }

            else {
                console.log('custom time limit reached')
            }
        }
    }

    tx_call(gasPrice);
}

call();