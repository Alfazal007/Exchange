import { RedisManager } from "./RedisManager";
import { UserTokenBalance } from "./db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

async function main() {
    const redisManager = await RedisManager.getInstance();
    const redisClient = redisManager.client;
    while (true) {
        const data = await redisClient.brPop("dbUpdateBalance", 0);
        if (!data) {
            continue;
        }
        const userId = data.element;
        try {
            const userSolanaBalance = await redisClient.get(userId + "solana") || "0";
            const userTokenBalance = await redisClient.get(userId + "token") || "0";
            await db.update(UserTokenBalance).set({
                solanaBalanceLamports: userSolanaBalance,
                tokenBalanceLamports: userTokenBalance
            }).where(eq(UserTokenBalance.userId, userId));
        } catch (err) {
            console.log("There was an error updating the database");
        }
    }
}


main()
