import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { DATABASEERRORS, NOREQUESTBODY, NOTENOUGHTOKENS, NOTFOUND, OFFRAMPSUCCESS, ORDERPRESENTERROR, SOLANANOTENOUGH, UNAUTHORIZED, ZEROBALANCE, ZODERRORS } from "../../constants/ReturnTypes";
import { offRampMoneyType } from "../../zodTypes/offRamp.removeMoney";
import { db } from "../../db";
import { UserTokenBalance } from "../../db/schema";
import { eq } from "drizzle-orm";
import { ApiResponse } from "../../utils/ApiResponse";
import { RedisManager } from "../../redis/SubscriberRedis";

const offRamp = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = offRampMoneyType.safeParse(req.body);
    if (!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const redisManager = await RedisManager.getInstance();
        const redisClient = redisManager.client;
        let isOrderPresentOnToken = await redisClient.get("orderPresent" + parsedData.data.tokenType + req.user.id);
        if (isOrderPresentOnToken && isOrderPresentOnToken != "0") {
            return res.status(400).json(new ApiError(400, ORDERPRESENTERROR, []));
        }
        let userBalance = await redisClient.get(req.user.id + parsedData.data.tokenType);
        let solanaBalance = await redisClient.get(req.user.id + "solana");
        if (!userBalance) {
            const userFromTheDatabase = await db.select().from(UserTokenBalance).where(eq(
                UserTokenBalance.userId, req.user.id
            ));
            if (userFromTheDatabase.length == 0) {
                return res.status(400).json(new ApiError(400, NOTFOUND, []));
            }
            if (parsedData.data.tokenType == "solana") {
                userBalance = userFromTheDatabase[0].solanaBalanceLamports;
            } else if (parsedData.data.tokenType == "token") {
                userBalance = userFromTheDatabase[0].tokenBalanceLamports;
            }
            solanaBalance = userFromTheDatabase[0].solanaBalanceLamports;
        }
        if (!userBalance || !solanaBalance) {
            return res.status(401).json(new ApiError(401, UNAUTHORIZED, []));
        }
        if (userBalance == "0") {
            return res.status(400).json(new ApiError(400, ZEROBALANCE, []));
        }
        if (solanaBalance == "0") {
            return res.status(400).json(new ApiError(400, SOLANANOTENOUGH, []))
        }
        if (BigInt(userBalance) < BigInt(parsedData.data.lamportsToRetreive)) {
            return res.status(400).json(new ApiError(400, NOTENOUGHTOKENS, []));
        }
        const offRampData = {
            userId: req.user.id,
            token: parsedData.data.tokenType,
            amount: parsedData.data.lamportsToRetreive
        };
        await redisClient.lPush("offramp", JSON.stringify(offRampData));
        return res.status(200).json(new ApiResponse(200, OFFRAMPSUCCESS, {}));
    } catch (err) {
        return res.status(400).json(new ApiError(400, DATABASEERRORS, []));
    }
});

export {
    offRamp
}
