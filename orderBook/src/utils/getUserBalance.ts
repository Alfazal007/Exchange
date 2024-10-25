import { RedisManager } from "../Managers/RedisManager"

const getUserBalance = async (userId: string, token: string): Promise<string> => {
    const userBalance = await RedisManager.getInstance().client.get(userId + token);
    if (!userBalance) {
        return "";
    }
    return userBalance;
}

export {
    getUserBalance
}
