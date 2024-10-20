import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.auth";
import { addPublicKey } from "../controllers/publicKeyController/controller.account.addPublicKey";

const publicKeyRouter = Router();

publicKeyRouter.route("/add-public-key").get(authMiddleware, addPublicKey);

export {
   publicKeyRouter 
}
