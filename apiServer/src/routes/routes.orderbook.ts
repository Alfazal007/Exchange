import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.auth";
import { createOrder } from "../controllers/orderBookController/controller.orderBook.createOrder";
import { deleteOrder } from "../controllers/orderBookController/controller.orderBook.deleteOrder";

const orderBookRouter = Router();

orderBookRouter.route("/create").post(authMiddleware, createOrder);
orderBookRouter.route("/delete").post(authMiddleware, deleteOrder);

export {
    orderBookRouter
}
