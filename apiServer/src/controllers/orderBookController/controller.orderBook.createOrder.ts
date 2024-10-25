import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { INVALIDPRICE, NOREQUESTBODY, ORDERERRORS, ORDERSUCCESSFUL, ZODERRORS } from "../../constants/ReturnTypes";
import { createOrderType } from "../../zodTypes/order.createOrderType";
import { v4 as uuid } from "uuid";
import { RedisManager } from "../../redis/SubscriberRedis";
import { ApiResponse } from "../../utils/ApiResponse";
import { client } from "../../redis/redis";

const createOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = createOrderType.safeParse(req.body);
    if (!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const orderId = uuid();
        const redisInstance = RedisManager.getInstance();
        const dataToBeSentToOrderBook = { ...parsedData.data, orderId, userId: req.user.id, orderType: "create" };
        try {
            BigInt(dataToBeSentToOrderBook.limit);
            BigInt(dataToBeSentToOrderBook.quantity);
            BigInt(dataToBeSentToOrderBook.price);
        } catch (err) {
            return res.status(400).json(new ApiError(400, INVALIDPRICE, []));

        }
        const response = await redisInstance.publishAndWaitForMessage(JSON.stringify(dataToBeSentToOrderBook), orderId);
        const prevOrders = await client.get("orderPresent" + dataToBeSentToOrderBook.kind === "buy" ? "token" : "solana" + req.user.id);
        if (!prevOrders) {
            await client.set("orderPresent" + dataToBeSentToOrderBook.kind === "buy" ? "token" : "solana" + req.user.id, "1");
        } else {
            const finalAmount = parseInt(prevOrders) + 1;
            await client.set("orderPresent" + dataToBeSentToOrderBook.kind === "buy" ? "token" : "solana" + req.user.id, finalAmount.toString());
        }
        return res.status(200).json(new ApiResponse(200, ORDERSUCCESSFUL, JSON.parse(response)));
    } catch (err) {
        console.log({ err });
        return res.status(400).json(new ApiError(400, ORDERERRORS, []));
    }
});

export {
    createOrder
}