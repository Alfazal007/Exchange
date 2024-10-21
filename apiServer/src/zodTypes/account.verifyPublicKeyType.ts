import { z } from "zod";

const verifyPublicKeyType = z.object({
    publicKey: z.string({message: "Public key not provided"}),
    signature: z.string({message: "Signature not provided"}),
});

export {
    verifyPublicKeyType
}
