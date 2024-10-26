export interface OrderBook {
    asks: Ask[],
    bids: Bid[]
}

export interface Ask {
    orderId: string,
    userId: string
    price: string,
    quantity: string,
}

export interface Bid {
    orderId: string,
    price: string,
    userId: string,
    quantity: string,
}
