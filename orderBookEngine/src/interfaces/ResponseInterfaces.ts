export interface CreateOrderResponse {
    marketFound: boolean,
    userBalanceFound: boolean,
    invalidData: boolean,
    balanceNotEnough: boolean,
    success: boolean
}

export interface DeleteOrderResponse {
    success: boolean
}
