import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { DATABASEERRORS, NOREQUESTBODY, NOTFOUND, PUBLICKEYVERIFICATIONFAILED, SUCCESSFUL, ZODERRORS } from "../../constants/ReturnTypes";
import { verifyPublicKeyType } from "../../zodTypes/account.verifyPublicKeyType";
import { db } from "../../db";
import { AccountTable } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { ed25519 } from '@noble/curves/ed25519';
import { ApiResponse } from "../../utils/ApiResponse";

const verifyPublicKey = asyncHandler(async(req: Request, res: Response) => {
    if(!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = verifyPublicKeyType.safeParse(req.body);
    if(!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    console.log(parsedData.data);
    try {
        const publicKeyAndUserId = await db.select().from(AccountTable).where(and(
            eq(AccountTable.publicKey, parsedData.data.publicKey),
            eq(AccountTable.userId, req.user.id)
        ));
        if(publicKeyAndUserId.length != 1) {
            return res.status(404).json(new ApiError(404, NOTFOUND, []));
        }
        const isValid = ed25519.verify(parsedData.data.signature, publicKeyAndUserId[0].publicKey + req.user.id, new TextEncoder().encode(publicKeyAndUserId[0].publicKey));
        if(!isValid) {
            return res.status(400).json(new ApiError(400, PUBLICKEYVERIFICATIONFAILED, []));
        }
        await db.update(AccountTable).set({
            isVerified: true
        }).where(and(
            eq(AccountTable.publicKey, parsedData.data.publicKey),
            eq(AccountTable.userId, req.user.id)));
        return res.status(200).json(new ApiResponse(200, SUCCESSFUL, []));
    } catch(err) {
        return res.status(400).json(new ApiError(400, DATABASEERRORS, []));
    }
});

export {
    verifyPublicKey
}
