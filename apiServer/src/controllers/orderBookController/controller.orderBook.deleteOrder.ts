import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { ACCOUNTNOTFOUND, ACCOUNTNOTVERIFIED, NOREQUESTBODY, ORDERDELETED, ORDERERRORS, ZODERRORS } from "../../constants/ReturnTypes";
import { deleteOrderType } from "../../zodTypes/order.deleteOrderType";
import { RedisManager } from "../../redis/SubscriberRedis";
import { ApiResponse } from "../../utils/ApiResponse";
import { AccountTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../../db";

const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = deleteOrderType.safeParse(req.body);
    if (!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const userAccount = await db.select().from(AccountTable).where(eq(AccountTable.userId, req.user.id));
        if (!userAccount || userAccount.length == 0) {
            return res.status(400).json(new ApiError(400, ACCOUNTNOTFOUND, []));
        }
        if (!userAccount[0].isVerified) {
            return res.status(400).json(new ApiError(400, ACCOUNTNOTVERIFIED, []));
        }
        const redisManager = await RedisManager.getInstance();
        const dataToBeSentToOrderBook = { userId: req.user.id, orderId: parsedData.data.orderId, market: parsedData.data.market, kind: parsedData.data.kind, orderType: "delete" };
        const response = await redisManager.publishAndWaitForMessage(JSON.stringify(dataToBeSentToOrderBook), parsedData.data.orderId);
        return res.status(200).json(new ApiResponse(200, ORDERDELETED, JSON.parse(response)));
    } catch (err) {
        return res.status(400).json(new ApiError(400, ORDERERRORS, []));
    }
});

export {
    deleteOrder
}
