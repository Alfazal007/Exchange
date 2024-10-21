import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/ApiErrors";
import { ALREADYVERIFIED, DATABASEERRORS, NOREQUESTBODY, NOTFOUND, PUBLICKEYVERIFICATIONFAILED, SUCCESSFUL, ZODERRORS } from "../../constants/ReturnTypes";
import { verifyPublicKeyType } from "../../zodTypes/account.verifyPublicKeyType";
import { db } from "../../db";
import { AccountTable } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { ed25519 } from '@noble/curves/ed25519';
import { ApiResponse } from "../../utils/ApiResponse";
import bs58 from "bs58";

const verifyPublicKey = asyncHandler(async(req: Request, res: Response) => {
    console.log(`PUT VERIFYPUBLICKEY ${req.ip}`)
    if(!req.body) {
        return res.status(400).json(new ApiError(400, NOREQUESTBODY, []));
    }
    const parsedData = verifyPublicKeyType.safeParse(req.body);
    if(!parsedData.success) {
        const errors = parsedData.error.errors.map((err) => err.message);
        return res.status(400).json(new ApiError(400, ZODERRORS, [], errors));
    }
    try {
        const publicKeyAndUserId = await db.select().from(AccountTable).where(and(
            eq(AccountTable.publicKey, parsedData.data.publicKey),
            eq(AccountTable.userId, req.user.id)
        ));
        if(publicKeyAndUserId.length != 1) {
            return res.status(404).json(new ApiError(404, NOTFOUND, []));
        }
        if(publicKeyAndUserId[0].isVerified) {
            return res.status(200).json(new ApiResponse(200, ALREADYVERIFIED, []))
        }
        const message = parsedData.data.publicKey + req.user.id;
        // convert message into uint8array
        const messageWhichWasSigned = new TextEncoder().encode(message);
        // convert signature into uint8array
        const signatureConverted = bs58.decode(parsedData.data.signature);
        // convert PK into uint8array
        const publicKeyOfUser = bs58.decode(publicKeyAndUserId[0].publicKey);
        const isValid = ed25519.verify(signatureConverted, messageWhichWasSigned, publicKeyOfUser);
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
