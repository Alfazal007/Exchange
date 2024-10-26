import { RedisManager } from "./Managers/RedisManager";
import { createOrder } from "./OrderHandlers/createOrder";

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
                continue;
            }
            console.log("create called");
            const res = await createOrder(orderData);
            console.log({ res });
            await redisClient.publish(orderData.orderId, "done");
        }
        else if (orderType == "delete") {
            const { orderId, userId, orderType } = orderData;
            if (!orderId || !userId || !!orderType) {
                continue;
            }
            console.log("data deletion called");
        }
    }
}

main();
