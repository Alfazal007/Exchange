interface CreateOrderResponse {
    marketFound: boolean,
    userBalanceFound: boolean,
    invalidData: boolean,
    balanceNotEnough: boolean,
    success: boolean
}

interface DeleteOrderResponse {
    success: boolean
}
