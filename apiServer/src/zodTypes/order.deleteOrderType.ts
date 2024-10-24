import { z } from "zod";

const deleteOrderType = z.object({
    orderId: z.string({ message: "Order id not provided" })
});

export {
    deleteOrderType
}
