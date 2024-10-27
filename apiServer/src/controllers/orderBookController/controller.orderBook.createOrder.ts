import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { INVALIDPRICE, NOREQUESTBODY, ORDERERRORS, ORDERSUCCESSFUL, ZODERRORS } from "../../constants/ReturnTypes";
import { createOrderType } from "../../zodTypes/order.createOrderType";
import { v4 as uuid } from "uuid";
import { RedisManager } from "../../redis/SubscriberRedis";
import { ApiResponse } from "../../utils/ApiResponse";

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
        const redisManager = await RedisManager.getInstance();
        const redisClient = redisManager.client;
        const orderId = uuid();
        const dataToBeSentToOrderBook = { ...parsedData.data, orderId, userId: req.user.id, orderType: "create" };
        try {
            let limit = BigInt(dataToBeSentToOrderBook.limit);
            BigInt(dataToBeSentToOrderBook.quantity);
            let price = BigInt(dataToBeSentToOrderBook.price);
            if (limit < price) {
                return res.status(400).json(new ApiError(400, INVALIDPRICE, []));
            }
        } catch (err) {
            return res.status(400).json(new ApiError(400, INVALIDPRICE, []));

        }
        const prevOrders = await redisClient.get(`orderPresent${dataToBeSentToOrderBook.kind === "buy" ? "token" : "solana"}${req.user.id}`);
        if (!prevOrders) {
            await redisClient.set(`orderPresent${dataToBeSentToOrderBook.kind === "buy" ? "token" : "solana"}${req.user.id}`, "1");
        } else {
            const finalAmount = parseInt(prevOrders) + 1;
            await redisClient.set(`orderPresent${dataToBeSentToOrderBook.kind === "buy" ? "token" : "solana"}${req.user.id}`, finalAmount.toString());
        }
        const response = await redisManager.publishAndWaitForMessage(JSON.stringify(dataToBeSentToOrderBook), orderId);
        return res.status(200).json(new ApiResponse(200, ORDERSUCCESSFUL, JSON.parse(response)));
    } catch (err) {
        console.log({ err });
        return res.status(400).json(new ApiError(400, ORDERERRORS, []));
    }
});

export {
    createOrder
}
