import { compare, genSalt, hash } from "bcryptjs";

const hashPassword = async(password: string): Promise<string> => {
    const salt = await genSalt(12);
    const hashedPassword = await hash(password, salt);
    return hashedPassword;
}

const isPasswordVerified = async(password: string, hashedPassword: string): Promise<boolean> => {
    const isValidPassword = await compare(password, hashedPassword);
    return isValidPassword;
}

export {
    hashPassword,
    isPasswordVerified
}
