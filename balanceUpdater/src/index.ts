import { Connection } from "@solana/web3.js";
import { findSendersForAccount } from "./helpers/findSendersOfData";
import { extractAndUpdateData } from "./helpers/fetchDataFromTransaction";
import { envVariables } from "./constants/envVariables";

export const connection = new Connection(envVariables.connectionUrl);

async function main() {
    try {
        let signaturesOfTransactions = await findSendersForAccount();
        if(signaturesOfTransactions.length == 0) {
            return;
        }
        await extractAndUpdateData(signaturesOfTransactions);
    } catch(err) {
        console.log(err);
    }
}

setInterval(main, 1000 * 120);
