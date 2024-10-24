import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { NOREQUESTBODY, ORDERDELETED, ORDERERRORS, ZODERRORS } from "../../constants/ReturnTypes";
import { deleteOrderType } from "../../zodTypes/order.deleteOrderType";
import { RedisManager } from "../../redis/SubscriberRedis";
import { ApiResponse } from "../../utils/ApiResponse";

const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = deleteOrderType.safeParse(req.body);
    if (parsedData.error) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const redisInstance = RedisManager.getInstance();
        const dataToBeSentToOrderBook = { userId: req.user.id, orderId: parsedData.data.orderId, orderType: "delete" };
        const response = await redisInstance.publishAndWaitForMessage(JSON.stringify(dataToBeSentToOrderBook), parsedData.data.orderId);
        return res.status(200).json(new ApiResponse(200, ORDERDELETED, JSON.parse(response)));
    } catch (err) {
        return res.status(400).json(new ApiError(400, ORDERERRORS, []));
    }
});

export {
    deleteOrder
}
