import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { DATABASEERRORS, NOREQUESTBODY, PUBLICKEYADDED, PUBLICKEYNOTVERIFIED, PUBLICKEYTAKEN, ZODERRORS } from "../../constants/ReturnTypes";
import { publicKeyType } from "../../zodTypes/account.publicKeyType";
import { db } from "../../db";
import { AccountTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { ApiResponse } from "../../utils/ApiResponse";

const addPublicKey = asyncHandler(async(req: Request, res: Response) => {
    console.log(`POST ADDPUBLICKEY ${req.ip}`)
    if(!req.body) {
        return res.status(500).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = publicKeyType.safeParse(req.body);
    if(!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const isAlreadyPresentData = await db.select().from(AccountTable).where(eq(
            AccountTable.publicKey, parsedData.data.publicKey
        ));
        if(isAlreadyPresentData.length > 0) {
            if(!isAlreadyPresentData[0].isVerified) {
                return res.status(400).json(new ApiError(400, PUBLICKEYNOTVERIFIED, []));
            } else {
                return res.status(400).json(new ApiError(400, PUBLICKEYTAKEN, []))
            }
        }
        await db.insert(AccountTable).values({
            publicKey: parsedData.data.publicKey,
            isVerified: false,
            userId: req.user.id
        });
        return res.status(200).json(new ApiResponse(200, PUBLICKEYADDED, {}));
    } catch(err) {
        return res.status(400).json(new ApiError(400, DATABASEERRORS, []));
    }
});

export {
    addPublicKey
}
