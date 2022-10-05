const { ethers, Wallet } = require('ethers');
const fetch = require("node-fetch");
const sleep = ms => new Promise(res => setTimeout(res, ms));

const privatekey = '3aaf25724408ee89faa2d191db1bee758a3a9b3288a6177294f027292fdec3bc';

const provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/1cd780d3ab7b4afbac02ab582852fa39');
const wallet = new ethers.Wallet(privatekey, provider);
const signer = wallet.connect(provider);


async function call() {

    const custom_fee = 30 * 1e9; //gas cap for tx
    const check_interval = 5000; // in ms
    const max_round = 10;
    const recipient = "0xdf39474cB1b8dC106b3636B1d854d4dE0Df446e4";

    const gas_resp = await fetch('https://gasstation-mumbai.matic.today/v2')
    const gas = await gas_resp.json();
    const gasPrice = parseInt((gas.fast.maxFee) * 1e9);
    // const gasPrice = parseInt(1 * 1e9); //for testing


    if (gasPrice <= custom_fee) {
        await tx_call(gasPrice);
    }

    else if (gasPrice > custom_fee) {
        let check = true;
        let round = 1;

        do {
            await sleep(check_interval);
            const gas_resp = await fetch('https://gasstation-mumbai.matic.today/v2')
            const gas = await gas_resp.json();
            const gasPrice = parseInt((gas.fast.maxFee) * 1e9);
            console.log('round: ', round);
            console.log('gas price', gasPrice);

            if (gasPrice <= custom_fee) {
                await tx_call(gasPrice);
                console.log('TX Success in round: ', round)
                check = false;
            }

            if (round > max_round) {
                check = false
                console.log('max time reached: try again')
            }
            round = round + 1;
        }

        while (check == true)

    }


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
            if (gasPrice <= custom_fee) {
                tx_call(gasPrice)
            }
            else {
                console.log('custom gas limit reached')
            }
        }
    }

    // const gasByProvider = await provider.getGasPrice();
    // console.log('etherjs gas: ' , gasByProvider.toNumber())


}

call();






// gas and transaction mgmt
