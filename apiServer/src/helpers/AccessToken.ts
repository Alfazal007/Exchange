import jwt from "jsonwebtoken";
import { envVariables } from "../config/envVariables";

interface UserAccessToken {
    id: string,
    username: string,
    email: string
}

const generateAccessToken = (user: UserAccessToken): string => {
    const accessToken = jwt.sign(user, envVariables.accessTokenSecret, {
        expiresIn: envVariables.accessTokenExpiry,
        algorithm: "HS256"
    });
    return accessToken;
}

const verifyToken = (accessToken: string): boolean => {
    try {
        jwt.verify(accessToken, envVariables.accessTokenSecret);
        return true;
    } catch(err) {
        return false;
    }
}

export {
    generateAccessToken,
    verifyToken
}
