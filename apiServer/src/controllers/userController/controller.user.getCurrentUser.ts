import { Request, Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { SUCCESSFUL } from "../../constants/ReturnTypes";

const getCurrentUser = asyncHandler(async(req: Request, res: Response) => {
    console.log(`GET GETCURRENTUSER ${req.ip}`);
    return res.status(200).json(new ApiResponse(200, SUCCESSFUL, req.user));
});

export {
    getCurrentUser
}
