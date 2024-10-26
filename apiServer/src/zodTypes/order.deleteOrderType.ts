import { z } from "zod";

const deleteOrderType = z.object({
    orderId: z.string({ message: "Order id not provided" }),
    market: z.string({ message: "Market not provided" }),
    kind: z.enum(["buy", "ask"])
});

export {
    deleteOrderType
}
