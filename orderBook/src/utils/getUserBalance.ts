import { RedisManager } from "../Managers/RedisManager";

const getUserBalance = async (userId: string, token: string): Promise<string> => {
    const redisManager = await RedisManager.getInstance();
    const redisClient = redisManager.client;
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    const userBalance = await redisClient.get(userId + token);
    if (!userBalance) {
        return "";
    }
    return userBalance;
}

export {
    getUserBalance
}
