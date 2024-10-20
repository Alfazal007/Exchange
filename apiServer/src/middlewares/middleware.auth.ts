import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiErrors";
import { DATABASEERRORS, NOTFOUND, UNAUTHORIZED } from "../constants/ReturnTypes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVariables } from "../config/envVariables";
import { db } from "../db";
import { UserTable } from "../db/schema";
import { eq } from "drizzle-orm";

interface User {
    id: string;
    username: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user: User;
        }
    }
}

const authMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let accessToken: string | undefined = req.cookies.accessToken || req.headers["authorization"];
    if(!accessToken) {
        return res.status(401).json(new ApiError(401, UNAUTHORIZED, []));
    }
    if(accessToken.startsWith("Bearer ")) {
        accessToken = accessToken.replace("Bearer ", "");
    }
    let userInfo;
    try {
        userInfo = jwt.verify(
            accessToken,
            envVariables.accessTokenSecret || ""
        ) as JwtPayload;
    } catch (error) {
        return res.status(403).json(new ApiError(403, UNAUTHORIZED, []));
    }
    if(!userInfo.id) {
        return res.status(401).json(new ApiError(401, UNAUTHORIZED, []));
    }
    try {
        const userFromDb = await db.select().from(UserTable).where(eq(
            UserTable.id, userInfo.id
        ));
        if(userFromDb.length == 0) {
            return res.status(404).json(new ApiError(404, NOTFOUND, []));
        }
        req.user = {
            id: userFromDb[0].id,
            username: userFromDb[0].username,
            email: userFromDb[0].email
        }
        next();
    } catch(err) {
        return res.status(400).json(new ApiError(400, DATABASEERRORS, []));
    }
});

export {
    authMiddleware
}
