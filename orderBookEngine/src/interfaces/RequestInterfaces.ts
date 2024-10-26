export interface CreateOrderRequest {
    orderId: string;
    userId: string;
    orderType: string;
    kind: "buy" | "ask";
    market: "SOL_TOKEN";
    limit: string;
    price: string;
    quantity: string;
}

export interface DeleteOrderRequest {
    userId: string;
    market: "SOL_TOKEN";
    orderId: string;
    kind: "buy" | "ask"
}
