import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.auth";
import { offRamp } from "../controllers/balanceExtract/controller.amount.offRamp";

const offrampRouter = Router();

offrampRouter.route("/take-out").post(authMiddleware, offRamp);

export {
    offrampRouter
}
