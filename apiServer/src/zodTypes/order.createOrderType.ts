import { z } from "zod";

const createOrderType = z.object({
    kind: z.enum(["buy", "ask"], { message: "Type of token can be buy or ask only" }),
    market: z.string({ message: "market not provided" }),
    limit: z.string({ message: "limit not provided" }),
    price: z.string({ message: "Price not provided" }),
    quantity: z.string({ message: "Quantity not provided" })
});

export {
    createOrderType
}
