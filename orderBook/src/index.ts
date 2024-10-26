import { OrderBookManager } from "./Managers/OrderBookManager";
import { RedisManager } from "./Managers/RedisManager";

async function main() {
    const orderBook = OrderBookManager.getInstance();
    while (true) {
        const redisManager = await RedisManager.getInstance();
        const redisClient = redisManager.client;
        const newOrder = await redisClient.brPop("orders", 0);
        if (!newOrder) {
            continue;
        }
        const orderData = JSON.parse(newOrder.element);
        const { orderType } = orderData;
        if (!orderType) {
            continue;
        } else if (orderType == "create") {
            const { orderId, userId, orderType, kind, market, limit, price, quantity } = orderData;
            if (!orderId || !userId || !kind || !market || !limit || !price || !quantity || !orderType) {
                continue;
            }
            orderBook.createOrder(orderData);
        }
        else if (orderType == "delete") {
            const { orderId, userId, orderType } = orderData;
            if (!orderId || !userId || !!orderType) {
                continue;
            }
            orderBook.deleteOrder({ market: "SOL_TOKEN", kind: orderType == "token" ? "buy" : "ask", userId, orderId });
        }
    }
}

main();
