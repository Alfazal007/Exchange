import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { DATABASEERRORS, DUPLICATEEMAIL, DUPLICATEUSERNAME, NOREQUESTBODY, SUCCESSFUL, ZODERRORS } from "../../constants/ReturnTypes";
import { createUserType } from "../../zodTypes/user.createUserType";
import { db } from "../../db";
import { UserTable } from "../../db/schema";
import { eq, or } from "drizzle-orm";
import { ApiResponse } from "../../utils/ApiResponse";
import { hashPassword } from "../../helpers/HashPassword";

const createUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = createUserType.safeParse(req.body);
    if (!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const userWithSimilarCredentials = await db.select().from(UserTable).where(or(
            eq(UserTable.email, parsedData.data.email),
            eq(UserTable.username, parsedData.data.username)
        )).limit(1);
        if (userWithSimilarCredentials.length > 0) {
            const sameCredsUser = userWithSimilarCredentials[0];
            if (sameCredsUser.username == parsedData.data.username) {
                return res.status(400).json(new ApiError(400, DUPLICATEUSERNAME, []));
            }
            if (sameCredsUser.email == parsedData.data.email) {
                return res.status(400).json(new ApiError(400, DUPLICATEEMAIL, []));
            }
        }
        const hashedPassword = await hashPassword(parsedData.data.password);
        const createdUser = await db.insert(UserTable).values({
            email: parsedData.data.email,
            username: parsedData.data.username,
            password: hashedPassword,
        }).returning({
            id: UserTable.id,
            username: UserTable.username,
            createdAt: UserTable.createdAt,
            email: UserTable.email
        });
        return res.status(201).json(new ApiResponse(201, SUCCESSFUL, createdUser));
    } catch (err) {
        return res.status(400).json(new ApiError(400, DATABASEERRORS, []));
    }
});

export {
    createUser
}
