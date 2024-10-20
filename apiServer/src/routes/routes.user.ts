import { Router } from "express";
import { createUser } from "../controllers/userController/controller.user.createUser";
import { loginUser } from "../controllers/userController/controller.user.login";
import { authMiddleware } from "../middlewares/middleware.auth";
import { getCurrentUser } from "../controllers/userController/controller.user.getCurrentUser";

const userRouter = Router();

userRouter.route("/create").post(createUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/current-user").get(authMiddleware, getCurrentUser);

export {
    userRouter
}
