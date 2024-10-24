import { z } from "zod";

const loginUserType = z.object({
    username: z.string({ message: "Username or not provided" }),
    password: z.string({ message: "Password not provided" }).min(6, { message: "The minimum length of password is 6" }).max(20, { message: "The maximum length of password is 20" }),
});

export {
    loginUserType
}
