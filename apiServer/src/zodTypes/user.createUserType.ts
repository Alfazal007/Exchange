import { z } from "zod";

const createUserType = z.object({
    username: z.string({ message: "Username not provided" }).trim().min(6, { message: "The minimum length of username is 6" }).max(20, { message: "The maximum length of username is 20" }),
    password: z.string({ message: "Password not provided" }).trim().min(6, { message: "The minimum length of password is 6" }).max(20, { message: "The maximum length of password is 20" }),
    email: z.string({ message: "Email not provided" }).trim().email({ message: "Email format is not valid" })
});

export {
    createUserType
}
