import { RedisManager } from "./Managers/RedisManager";
import { createOrder } from "./OrderHandlers/createOrder";
import { deleteOrder } from "./OrderHandlers/deleteOrder";

async function main() {
    const redisManager = await RedisManager.getInstance();
    const redisClient = redisManager.client;
    while (true) {
        const data = await redisClient.brPop("orders", 0);
        if (!data) {
            continue;
        }
        const orderData = JSON.parse(data.element);
        const { orderType } = orderData;
        if (!orderType) {
            continue;
        } else if (orderType == "create") {
            const { orderId, userId, orderType, kind, market, limit, price, quantity } = orderData;
            if (!orderId || !userId || !kind || !market || !limit || !price || !quantity || !orderType) {
                await redisClient.publish(orderData.orderId, JSON.stringify({ message: "invalid data" }));
                continue;
            }
            const res = await createOrder(orderData);
            await redisClient.publish(orderData.orderId, JSON.stringify(res));
        }
        else if (orderType == "delete") {
            const { orderId, userId, market, kind } = orderData;
            if (!orderId || !userId || !market || !kind) {
                await redisClient.publish(orderData.orderId, JSON.stringify({ message: "invalid data" }));
                continue;
            }
            const res = await deleteOrder(orderData);
            await redisClient.publish(orderData.orderId, JSON.stringify(res));
        }
    }
}

main();
