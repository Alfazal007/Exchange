import { Connection } from "@solana/web3.js";
import { processOfframp } from "./processOffRamp";
import { client } from "./redis";
import { envVariables } from "./envVariables";

export const connection = new Connection(envVariables.connectionUrl);

async function main() {
    while(true) {
        if(!client.isOpen) {
            await client.connect();
        }
        const offRampDataInString = await client.brPop("offramp", 0);
        if(!offRampDataInString) {
            continue;
        }
        await processOfframp(offRampDataInString.element);
    }
}

main();
