import { DeleteOrderRequest } from "../interfaces/RequestInterfaces";
import { DeleteOrderResponse } from "../interfaces/ResponseInterfaces";
import { OrderBooksManager } from "../Managers/OrderBookManager";
import { RedisManager } from "../Managers/RedisManager";

export async function deleteOrder(deleteOrderData: DeleteOrderRequest): Promise<DeleteOrderResponse> {
    const { market, userId, orderId, kind } = deleteOrderData;
    const orderBookManager = OrderBooksManager.getInstance();
    const orderBookMap = orderBookManager.orderBooks;
    const orderBook = orderBookMap.get(market);
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
    return {
        success: true
    }
}
