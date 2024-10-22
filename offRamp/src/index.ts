import { processOfframp } from "./processOffRamp";
import { client } from "./redis";

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
