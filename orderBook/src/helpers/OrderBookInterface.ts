interface OrderBook {
    asks: Ask[],
    bids: Bid[]
}


interface Ask {
    orderId: string,
    userId: string
    price: string,
    quantity: string,
    token: string
}

interface Bid {
    orderId: string,
    price: string,
    userId: string,
    quantity: string,
}
