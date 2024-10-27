import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { DATABASEERRORS, INCORRECTPASSWORD, LOGINSUCCESSFUL, NOREQUESTBODY, NOTFOUND, ZODERRORS } from "../../constants/ReturnTypes";
import { loginUserType } from "../../zodTypes/user.loginType";
import { db } from "../../db";
import { UserTable } from "../../db/schema";
import { eq, or } from "drizzle-orm";
import { isPasswordVerified } from "../../helpers/HashPassword";
import { generateAccessToken } from "../../helpers/AccessToken";
import { ApiResponse } from "../../utils/ApiResponse";

const loginUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = loginUserType.safeParse(req.body);
    if (!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const userFromDatabase = await db.select().from(UserTable).where(or(
            eq(UserTable.email, parsedData.data.username),
            eq(UserTable.username, parsedData.data.username),
        ));
        if (userFromDatabase.length == 0) {
            return res.status(404).json(new ApiError(404, NOTFOUND, []));
        }
        const userFound = userFromDatabase[0];
        const isValidPassword = await isPasswordVerified(parsedData.data.password, userFound.password);
        if (!isValidPassword) {
            return res.status(400).json(new ApiError(400, INCORRECTPASSWORD, []));
        }
        const accessToken = generateAccessToken({
            username: userFound.username,
            email: userFound.email,
            id: userFound.id
        });
        return res.status(200)
            .cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: true
            })
            .json(new ApiResponse(200, LOGINSUCCESSFUL, { accessToken }));
    } catch (err) {
        return res.status(400).json(new ApiError(400, DATABASEERRORS, []));
    }
});

export {
    loginUser
}
