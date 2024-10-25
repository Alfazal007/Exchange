import { getUserBalance } from "../utils/getUserBalance";
import { RedisManager } from "./RedisManager";

export class OrderBookManager {
    private orderBooks;
    private static instace: OrderBookManager;

    private constructor() {
        this.orderBooks = new Map<string, OrderBook>();
    }

    private static getInstance(): OrderBookManager {
        if (!this.instace) {
            this.instace = new OrderBookManager();
        }
        return this.instace;
    }

    private async createOrder(createOrderData: CreateOrderRequest): CreateOrderResponse {
        const orderBook = this.orderBooks.get(createOrderData.market);
        if (!this.orderBooks.has(createOrderData.market) || !orderBook) {
            return {
                marketFound: false,
                balanceNotEnough: true,
                userBalanceFound: false,
                invalidData: false,
                success: false
            }
        }
        let quantity, limit;
        try {
            limit = BigInt(createOrderData.limit);
            quantity = BigInt(createOrderData.quantity);
        } catch (err) {
            return {
                marketFound: false,
                userBalanceFound: false,
                invalidData: true,
                balanceNotEnough: true,
                success: false
            }
        }
        // user came to buy solana
        if (createOrderData.kind == "buy") {
            const userBalanceInString = await getUserBalance(createOrderData.userId, "token");
            if (!userBalanceInString || userBalanceInString == "") {
                return {
                    marketFound: true,
                    userBalanceFound: false,
                    invalidData: false,
                    balanceNotEnough: true,
                    success: false
                }
            }
            let userBalance;
            try {
                userBalance = BigInt(userBalanceInString);
            } catch (err) {
                return {
                    marketFound: true,
                    userBalanceFound: true,
                    balanceNotEnough: true,
                    invalidData: true,
                    success: false
                }
            }
            const requiredBalance = quantity * limit;
            if (userBalance < requiredBalance) {
                return {
                    marketFound: true,
                    userBalanceFound: true,
                    invalidData: false,
                    balanceNotEnough: true,
                    success: false
                }
            }
            const asks = orderBook.asks;
            let filledQuantity = BigInt(0);
            let filledCompletely = false;
            let latestAsks = [];
            for (let i = 0; i < asks.length; i++) {
                const currentAsk = asks[i];
                if (BigInt(currentAsk.price) > BigInt(createOrderData.limit) || filledCompletely == true) {
                    latestAsks.push(currentAsk);
                    continue;
                } else {
                    if (BigInt(currentAsk.quantity) == (BigInt(createOrderData.quantity) - BigInt(filledQuantity))) {
                        filledCompletely = true;
                        filledQuantity = BigInt(createOrderData.quantity);
                        const prevSolanaHoldingsOfAsker = await RedisManager.getInstance().client.get(currentAsk.userId + "solana") as string;
                        await RedisManager.getInstance().client.set(currentAsk.userId + "solana", (BigInt(prevSolanaHoldingsOfAsker) - BigInt(currentAsk.quantity)).toString());
                        const prevTokenOfAskerInString = await getUserBalance(currentAsk.userId, "token");
                        const newTokenOfAsker = BigInt(prevTokenOfAskerInString) + (BigInt(currentAsk.quantity) * BigInt(currentAsk.price));
                        await RedisManager.getInstance().client.set(currentAsk.userId + "token", newTokenOfAsker.toString());
                        const prevOrdersOfAsker = await RedisManager.getInstance().client.get("orderPresent" + "solana" + currentAsk.userId) as string;
                        await RedisManager.getInstance().client.set("orderPresent" + "solana" + currentAsk.userId, (parseInt(prevOrdersOfAsker) - 1).toString());
                        const prevSolanaOfBidder = await RedisManager.getInstance().client.get(createOrderData.userId + "solana") as string;
                        await RedisManager.getInstance().client.set(createOrderData.userId + "solana", (BigInt(prevSolanaOfBidder) + BigInt(currentAsk.quantity)).toString());
                        const prevTokensOfBidder = await RedisManager.getInstance().client.get(createOrderData.userId + "token") as string;
                        const tokensToRemove = limit * BigInt(currentAsk.quantity);
                        await RedisManager.getInstance().client.set(createOrderData.userId + "token", (BigInt(prevTokensOfBidder) - tokensToRemove).toString());
                        await RedisManager.getInstance().client.lPush("dbUpdateBalance", currentAsk.userId);
                    } else if (BigInt(currentAsk.quantity) < (BigInt(createOrderData.quantity) - BigInt(filledQuantity))) {
                        filledQuantity = filledQuantity + BigInt(currentAsk.quantity);
                        const prevSolanaHoldingsOfAsker = await RedisManager.getInstance().client.get(currentAsk.userId + "solana") as string;
                        await RedisManager.getInstance().client.set(currentAsk.userId + "solana", (BigInt(prevSolanaHoldingsOfAsker) - BigInt(currentAsk.quantity)).toString());
                        const prevTokenOfAskerInString = await getUserBalance(currentAsk.userId, "token");
                        const newTokenOfAsker = BigInt(prevTokenOfAskerInString) + (BigInt(currentAsk.quantity) * BigInt(currentAsk.price));
                        await RedisManager.getInstance().client.set(currentAsk.userId + "token", newTokenOfAsker.toString());
                        const prevOrdersOfAsker = await RedisManager.getInstance().client.get("orderPresent" + "solana" + currentAsk.userId) as string;
                        await RedisManager.getInstance().client.set("orderPresent" + "solana" + currentAsk.userId, (parseInt(prevOrdersOfAsker) - 1).toString());
                        const prevSolanaOfBidder = await RedisManager.getInstance().client.get(createOrderData.userId + "solana") as string;
                        await RedisManager.getInstance().client.set(createOrderData.userId + "solana", (BigInt(prevSolanaOfBidder) + BigInt(currentAsk.quantity)).toString());
                        const prevTokensOfBidder = await RedisManager.getInstance().client.get(createOrderData.userId + "token") as string;
                        const tokensToRemove = limit * BigInt(currentAsk.quantity);
                        await RedisManager.getInstance().client.set(createOrderData.userId + "token", (BigInt(prevTokensOfBidder) - tokensToRemove).toString());
                        await RedisManager.getInstance().client.lPush("dbUpdateBalance", currentAsk.userId);
                    } else {
                        filledQuantity = filledQuantity + BigInt(createOrderData.quantity);
                        const prevSolanaHoldingsOfAskerInString = await RedisManager.getInstance().client.get(currentAsk.userId + "solana") as string;
                        await RedisManager.getInstance().client.set(currentAsk.userId + "solana", (BigInt(prevSolanaHoldingsOfAskerInString) - BigInt(createOrderData.quantity)).toString());
                        const prevTokenHoldingOfAskerInString = await RedisManager.getInstance().client.get(currentAsk.userId + "token") as string;
                        await RedisManager.getInstance().client.set(currentAsk.userId + "token", (BigInt(prevTokenHoldingOfAskerInString) + (BigInt(currentAsk.price) * BigInt(createOrderData.quantity))).toString());
                        latestAsks.push({ ...currentAsk, quantity: (BigInt(currentAsk.quantity) - BigInt(createOrderData.quantity)).toString() });
                        const prevSolanaOfBidder = await RedisManager.getInstance().client.get(createOrderData.userId + "solana") as string;
                        await RedisManager.getInstance().client.set(createOrderData.userId + "solana", (BigInt(prevSolanaOfBidder) + BigInt(createOrderData.quantity)).toString());
                        const prevTokensOfBidder = await RedisManager.getInstance().client.get(createOrderData.userId + "token") as string;
                        await RedisManager.getInstance().client.set(createOrderData.userId + "token", (BigInt(prevTokensOfBidder) - (BigInt(createOrderData.quantity) * BigInt(createOrderData.limit))).toString());
                        filledCompletely = true;
                        await RedisManager.getInstance().client.lPush("dbUpdateBalance", currentAsk.userId);
                    }
                }
            }
            await RedisManager.getInstance().client.lPush("dbUpdateBalance", createOrderData.userId);
            // @ts-ignore
            this.orderBooks.get(createOrderData.market).asks = latestAsks;
            if (!filledCompletely) {
                // @ts-ignore
                this.orderBooks.get(createOrderData.market).bids.push({
                    price: createOrderData.limit,
                    userId: createOrderData.userId,
                    orderId: createOrderData.orderId,
                    quantity: (BigInt(createOrderData.quantity) - BigInt(filledQuantity)).toString()
                });
            } else {
                const prevOrderNumbers = await RedisManager.getInstance().client.get("orderPresent" + "token" + createOrderData.userId) as string;
                await RedisManager.getInstance().client.set("orderPresent" + "token" + createOrderData.userId, (BigInt(prevOrderNumbers) - BigInt(1)).toString());
            }
        } else {

        }
    }
}
