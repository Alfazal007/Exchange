import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.auth";
import { addPublicKey } from "../controllers/publicKeyController/controller.account.addPublicKey";
import { verifyPublicKey } from "../controllers/publicKeyController/controller.account.validatePublicKey";

const publicKeyRouter = Router();

publicKeyRouter.route("/add-public-key").post(authMiddleware, addPublicKey);
publicKeyRouter.route("/verify-public-key").put(authMiddleware, verifyPublicKey);

export {
   publicKeyRouter 
}
