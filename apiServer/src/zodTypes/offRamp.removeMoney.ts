import { z } from "zod";

const offRampMoneyType = z.object({
    tokenType: z.enum(["solana", "token"], {message: "Type of token not provided or not properly provided"}),
    lamportsToRetreive: z.string({message: "Lamports to retreive not provided"}),
});

export {
    offRampMoneyType
}
