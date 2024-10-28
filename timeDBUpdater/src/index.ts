import { initDatabase, insertDataToTSDB } from "./DatabaseInit";
import { RedisManager } from "./RedisManager";
import { OrderBookData } from "./types/OrderbookDatatype";

async function main() {
    const redisManager = await RedisManager.getInstance();
    const redisClient = redisManager.client;
    while (true) {
        const data = await redisClient.brPop("timedb", 0);
        if (!data) {
            continue;
        }
        const dataFromOrderbook: OrderBookData = JSON.parse(data.element);
        if (!dataFromOrderbook.time || !dataFromOrderbook.type || !dataFromOrderbook.orderBook || !dataFromOrderbook.latestTrade) {
            continue;
        }
        if (dataFromOrderbook.type == "create") {
            if (dataFromOrderbook.latestTrade != "-1") {
                await insertDataToTSDB(new Date(parseInt(dataFromOrderbook.time)), "SOLANA", dataFromOrderbook.latestTrade);
            }
        }
        // TODO:: send to the websocket layer by queue or something else
        console.log("send to the websocket");
    }
}


initDatabase()
    .then(() => { "Database initialized" })
    .catch((err) => {
        console.log("There was an error", err);
        process.exit(0);
    });

main();
