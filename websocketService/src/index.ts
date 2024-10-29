import { WebSocketServer } from 'ws';
import { OrderBookHandler } from './Managers/OrderBookUpdateManager';
import { createClient } from 'redis';
import protobuf from "protobufjs";
import { Ask, Bid } from './types/interfaces';
import { arrayCompressor } from './helpers/arrayCompressor';
import { forEachChild } from 'typescript';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
    OrderBookHandler.getInstance().addHandlers(ws);
    ws.send('something');
});

const client = createClient();

async function main() {
    const protoFile = await protobuf.load('orderbook.proto');
    const orderBookProtoType = protoFile.lookupType('Orderbook');
    while (true) {
        if (!client.isOpen || !client.isReady) {
            await client.connect();
        }
        const data = await client.brPop("websocket", 0);
        if (!data) {
            continue;
        }
        try {
            const parsedData = JSON.parse(data.element);
            if (!parsedData || !parsedData.orderBook || !parsedData.orderBook.data) {
                continue;
            }
            const orderBookDecoded = orderBookProtoType.decode(parsedData.orderBook.data).toJSON();
            const asks: Ask[] = orderBookDecoded.asks || [];
            const bids: Bid[] = orderBookDecoded.bids || [];
            const latestTradedPrice: string = orderBookDecoded.latestTrade || "-1";
            let asksToReturn: { quantity: string, price: string }[] = [];
            let bidsToReturn: { quantity: string, price: string }[] = [];
            if (asks.length > 1) {
                asksToReturn = arrayCompressor(asks);
            } else if (asks.length == 1) {
                asksToReturn.push({ quantity: asks[0].quantity, price: asks[0].price })
            }
            if (bids.length > 1) {
                bidsToReturn = arrayCompressor(bids);
            } else if (bids.length == 1) {
                bidsToReturn.push({ quantity: bids[0].quantity, price: bids[0].price })
            }
            const users = OrderBookHandler.getInstance().usersSolToken;
            users.forEach((user) => {
                user.connection.send(JSON.stringify({
                    orderBook: {
                        asks: asksToReturn,
                        bids: bidsToReturn
                    },
                    latestTradedPrice
                }));
            });
        } catch (err) {
            continue;
        }
    }
}

main();
