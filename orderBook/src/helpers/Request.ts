interface CreateOrderRequest {
    orderId: string;
    userId: string;
    orderType: string;
    kind: "buy" | "ask";
    market: "SOL_TOKEN";
    limit: string;
    price: string;
    quantity: string;
}

interface DeleteOrderRequest {
    userId: string;
    orderId: string;
    orderType: string;
}
