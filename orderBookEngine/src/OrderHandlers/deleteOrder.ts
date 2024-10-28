import { DeleteOrderRequest } from "../interfaces/RequestInterfaces";
import { DeleteOrderResponse } from "../interfaces/ResponseInterfaces";
import { OrderBooksManager } from "../Managers/OrderBookManager";
import { RedisManager } from "../Managers/RedisManager";
import protobuf from "protobufjs";

export async function deleteOrder(deleteOrderData: DeleteOrderRequest): Promise<DeleteOrderResponse> {
    const { market, userId, orderId, kind } = deleteOrderData;
    const orderBookManager = OrderBooksManager.getInstance();
    const orderBookMap = orderBookManager.orderBooks;
    const orderBook = orderBookMap.get(market);
    if (!orderBook) {
        return {
            success: false,
        }
    }

    const redisManager = await RedisManager.getInstance();
    if (kind == "buy") {
        if (orderBook?.bids) {
            let currentBids = orderBook.bids;
            let latestBids = [];
            for (let i = 0; i < currentBids.length; i++) {
                if (currentBids[i].orderId != orderId || currentBids[i].userId != userId) {
                    latestBids.push(currentBids[i]);
                } else {
                    const prevOrderNumbers = (await redisManager.client.get(
                        "orderPresent" + "token" + userId
                    )) as string;
                    await redisManager.client.set(
                        "orderPresent" + "token" + userId,
                        (BigInt(prevOrderNumbers) - BigInt(1)).toString()
                    );
                }
            }
            orderBook.bids = latestBids;
        }
    } else if (kind == "ask") {
        if (orderBook?.asks) {
            let currentAsks = orderBook.asks;
            let latestAsks = [];
            for (let i = 0; i < currentAsks.length; i++) {
                if (currentAsks[i].orderId != orderId || currentAsks[i].userId != userId) {
                    latestAsks.push(currentAsks[i]);
                } else {
                    const prevOrderNumbers = (await redisManager.client.get(
                        "orderPresent" + "solana" + userId
                    )) as string;
                    await redisManager.client.set(
                        "orderPresent" + "solana" + userId,
                        (BigInt(prevOrderNumbers) - BigInt(1)).toString()
                    );
                }
            }
            orderBook.asks = latestAsks;
        }
    }
    const protoFile = await protobuf.load('orderbook.proto');
    const orderBookProtoType = protoFile.lookupType('Orderbook');
    const orderBookCompressed = orderBookProtoType.encode({
        asks: orderBook.asks,
        bids: orderBook.bids,
        latestTrade: "-1"
    }).finish();
    const timeDBData = {
        orderBook: orderBookCompressed,
        latestTrade: "-1",
        time: Date.now().toLocaleString(),
        type: "delete"
    }
    console.log("asks");
    console.log(orderBook.asks);
    console.log("bids");
    console.log(orderBook.bids);
    await redisManager.client.lPush("timedb", JSON.stringify(timeDBData));
    return {
        success: true
    }
}
