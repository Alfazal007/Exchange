import { z } from "zod";

const publicKeyType = z.object({
    publicKey: z.string({ message: "Public key not provided" }),
});

export {
    publicKeyType
}
