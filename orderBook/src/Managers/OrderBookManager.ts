import { getUserBalance } from "../utils/getUserBalance";
import { RedisManager } from "./RedisManager";


export class OrderBookManager {
    private orderBooks;
    private static instace: OrderBookManager;

    private constructor() {
        this.orderBooks = new Map<string, OrderBook>();
        this.orderBooks.set("SOL_TOKEN", { asks: [], bids: [] });
    }

    public static getInstance(): OrderBookManager {
        if (!this.instace) {
            this.instace = new OrderBookManager();
        }
        return this.instace;
    }

    public async createOrder(
        createOrderData: CreateOrderRequest
    ): Promise<CreateOrderResponse> {
        const redisManager = await RedisManager.getInstance();
        const redisClient = redisManager.client;
        console.log({ redisClient });
        console.log(redisClient.isOpen);
        console.log("create a order hit");
        console.log(createOrderData);
        const orderBook = this.orderBooks.get(createOrderData.market);
        if (!this.orderBooks.has(createOrderData.market) || !orderBook) {
            return {
                marketFound: false,
                balanceNotEnough: true,
                userBalanceFound: false,
                invalidData: false,
                success: false,
            };
        }
        console.log("Asks before");
        console.log(orderBook.asks);
        console.log("bids before");
        console.log(orderBook.bids);
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
                success: false,
            };
        }
        if (createOrderData.kind == "buy") {
            const userBalanceInString = await getUserBalance(
                createOrderData.userId,
                "token"
            );
            console.log(
                `This user's current token balance is ${userBalanceInString}`
            );
            if (!userBalanceInString || userBalanceInString == "") {
                return {
                    marketFound: true,
                    userBalanceFound: false,
                    invalidData: false,
                    balanceNotEnough: true,
                    success: false,
                };
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
                    success: false,
                };
            }
            const requiredBalance = quantity * limit;
            console.log(userBalance < requiredBalance);
            if (userBalance < requiredBalance) {
                return {
                    marketFound: true,
                    userBalanceFound: true,
                    invalidData: false,
                    balanceNotEnough: true,
                    success: false,
                };
            }
            console.log("here");
            const asks = orderBook.asks;
            let filledQuantity = BigInt(0);
            let filledCompletely = false;
            let latestAsks = [];
            for (let i = 0; i < asks.length; i++) {
                const currentAsk = asks[i];
                if (
                    BigInt(currentAsk.price) > BigInt(createOrderData.limit) ||
                    filledCompletely == true
                ) {
                    latestAsks.push(currentAsk);
                    continue;
                } else {
                    if (
                        BigInt(currentAsk.quantity) ==
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity)
                    ) {
                        filledCompletely = true;
                        filledQuantity = BigInt(createOrderData.quantity);
                        const prevSolanaHoldingsOfAsker =
                            (await redisClient.get(
                                currentAsk.userId + "solana"
                            )) as string;
                        await redisClient.set(
                            currentAsk.userId + "solana",
                            (
                                BigInt(prevSolanaHoldingsOfAsker) -
                                BigInt(currentAsk.quantity)
                            ).toString()
                        );
                        const prevTokenOfAskerInString = await getUserBalance(
                            currentAsk.userId,
                            "token"
                        );
                        const newTokenOfAsker =
                            BigInt(prevTokenOfAskerInString) +
                            BigInt(currentAsk.quantity) *
                            BigInt(currentAsk.price);
                        await redisClient.set(
                            currentAsk.userId + "token",
                            newTokenOfAsker.toString()
                        );
                        const prevOrdersOfAsker = (await redisClient.get(
                            "orderPresent" + "solana" + currentAsk.userId
                        )) as string;
                        await redisClient.set(
                            "orderPresent" + "solana" + currentAsk.userId,
                            (parseInt(prevOrdersOfAsker) - 1).toString()
                        );
                        const prevSolanaOfBidder = (await redisClient.get(
                            createOrderData.userId + "solana"
                        )) as string;
                        await redisClient.set(
                            createOrderData.userId + "solana",
                            (
                                BigInt(prevSolanaOfBidder) +
                                BigInt(currentAsk.quantity)
                            ).toString()
                        );
                        const prevTokensOfBidder = (await redisClient.get(
                            createOrderData.userId + "token"
                        )) as string;
                        const tokensToRemove =
                            limit * BigInt(currentAsk.quantity);
                        await redisClient.set(
                            createOrderData.userId + "token",
                            (
                                BigInt(prevTokensOfBidder) - tokensToRemove
                            ).toString()
                        );
                        await redisClient.lPush(
                            "dbUpdateBalance",
                            currentAsk.userId
                        );
                    } else if (
                        BigInt(currentAsk.quantity) <
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity)
                    ) {
                        filledQuantity =
                            filledQuantity + BigInt(currentAsk.quantity);
                        const prevSolanaHoldingsOfAsker =
                            (await redisClient.get(
                                currentAsk.userId + "solana"
                            )) as string;
                        await redisClient.set(
                            currentAsk.userId + "solana",
                            (
                                BigInt(prevSolanaHoldingsOfAsker) -
                                BigInt(currentAsk.quantity)
                            ).toString()
                        );
                        const prevTokenOfAskerInString = await getUserBalance(
                            currentAsk.userId,
                            "token"
                        );
                        const newTokenOfAsker =
                            BigInt(prevTokenOfAskerInString) +
                            BigInt(currentAsk.quantity) *
                            BigInt(currentAsk.price);
                        await redisClient.set(
                            currentAsk.userId + "token",
                            newTokenOfAsker.toString()
                        );
                        const prevOrdersOfAsker = (await redisClient.get(
                            "orderPresent" + "solana" + currentAsk.userId
                        )) as string;
                        await redisClient.set(
                            "orderPresent" + "solana" + currentAsk.userId,
                            (parseInt(prevOrdersOfAsker) - 1).toString()
                        );
                        const prevSolanaOfBidder = (await redisClient.get(
                            createOrderData.userId + "solana"
                        )) as string;
                        await redisClient.set(
                            createOrderData.userId + "solana",
                            (
                                BigInt(prevSolanaOfBidder) +
                                BigInt(currentAsk.quantity)
                            ).toString()
                        );
                        const prevTokensOfBidder = (await redisClient.get(
                            createOrderData.userId + "token"
                        )) as string;
                        const tokensToRemove =
                            limit * BigInt(currentAsk.quantity);
                        await redisClient.set(
                            createOrderData.userId + "token",
                            (
                                BigInt(prevTokensOfBidder) - tokensToRemove
                            ).toString()
                        );
                        await redisClient.lPush(
                            "dbUpdateBalance",
                            currentAsk.userId
                        );
                    } else {
                        const quantityToBeFilled =
                            BigInt(createOrderData.quantity) - filledQuantity;
                        filledQuantity = BigInt(createOrderData.quantity);
                        const prevSolanaHoldingsOfAskerInString =
                            (await redisClient.get(
                                currentAsk.userId + "solana"
                            )) as string;
                        await redisClient.set(
                            currentAsk.userId + "solana",
                            (
                                BigInt(prevSolanaHoldingsOfAskerInString) -
                                quantityToBeFilled
                            ).toString()
                        );
                        const prevTokenHoldingOfAskerInString =
                            (await redisClient.get(
                                currentAsk.userId + "token"
                            )) as string;
                        await redisClient.set(
                            currentAsk.userId + "token",
                            (
                                BigInt(prevTokenHoldingOfAskerInString) +
                                BigInt(currentAsk.price) * quantityToBeFilled
                            ).toString()
                        );
                        latestAsks.push({
                            ...currentAsk,
                            quantity: (
                                BigInt(currentAsk.quantity) - quantityToBeFilled
                            ).toString(),
                        });
                        const prevSolanaOfBidder = (await redisClient.get(
                            createOrderData.userId + "solana"
                        )) as string;
                        await redisClient.set(
                            createOrderData.userId + "solana",
                            (
                                BigInt(prevSolanaOfBidder) + quantityToBeFilled
                            ).toString()
                        );
                        const prevTokensOfBidder = (await redisClient.get(
                            createOrderData.userId + "token"
                        )) as string;
                        await redisClient.set(
                            createOrderData.userId + "token",
                            (
                                BigInt(prevTokensOfBidder) -
                                quantityToBeFilled *
                                BigInt(createOrderData.limit)
                            ).toString()
                        );
                        filledCompletely = true;
                        await redisClient.lPush(
                            "dbUpdateBalance",
                            currentAsk.userId
                        );
                    }
                }
            }
            console.log("1");
            console.log(createOrderData.userId);
            console.log(redisClient.isReady)
            if (!redisClient.isOpen) {
                await redisClient.connect();
            }
            await redisClient.lPush(
                "dbUpdateBalance",
                JSON.stringify(createOrderData.userId)
            );
            console.log("2");
            // @ts-ignore
            this.orderBooks.get(createOrderData.market).asks = latestAsks;
            if (!filledCompletely) {
                console.log("3");
                // @ts-ignore
                this.orderBooks.get(createOrderData.market).bids.push({
                    price: createOrderData.limit,
                    userId: createOrderData.userId,
                    orderId: createOrderData.orderId,
                    quantity: (
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity)
                    ).toString(),
                });
            } else {
                console.log("4");
                const prevOrderNumbers = (await redisClient.get(
                    "orderPresent" + "token" + createOrderData.userId
                )) as string;
                await redisClient.set(
                    "orderPresent" + "token" + createOrderData.userId,
                    (BigInt(prevOrderNumbers) - BigInt(1)).toString()
                );
            }
            console.log("Asks after");
            console.log(orderBook.asks);
            console.log("bids after");
            console.log(orderBook.bids);
        } else if (createOrderData.kind == "ask") {
            const userBalanceInString = await getUserBalance(
                createOrderData.userId,
                "solana"
            );
            if (!userBalanceInString || userBalanceInString == "") {
                return {
                    marketFound: true,
                    userBalanceFound: false,
                    invalidData: false,
                    balanceNotEnough: true,
                    success: false,
                };
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
                    success: false,
                };
            }
            const requiredBalance = quantity;
            if (userBalance < requiredBalance) {
                return {
                    marketFound: true,
                    userBalanceFound: true,
                    invalidData: false,
                    balanceNotEnough: true,
                    success: false,
                };
            }
            const bids = orderBook.bids;
            let filledQuantity = BigInt(0);
            let filledCompletely = false;
            let latestBids = [];
            for (let i = 0; i < bids.length; i++) {
                const currentBid = bids[i];
                if (
                    BigInt(currentBid.price) < BigInt(createOrderData.price) ||
                    filledCompletely == true
                ) {
                    latestBids.push(currentBid);
                    continue;
                } else {
                    if (
                        BigInt(currentBid.quantity) ==
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity)
                    ) {
                        filledCompletely = true;
                        filledQuantity = BigInt(createOrderData.quantity);
                        const prevSolanaHoldingsOfAsker =
                            (await redisClient.get(
                                createOrderData.userId + "solana"
                            )) as string;
                        await redisClient.set(
                            createOrderData.userId + "solana",
                            (
                                BigInt(prevSolanaHoldingsOfAsker) -
                                BigInt(currentBid.quantity)
                            ).toString()
                        );
                        const prevTokenOfAskerInString = await getUserBalance(
                            createOrderData.userId,
                            "token"
                        );
                        const newTokenOfAsker =
                            BigInt(prevTokenOfAskerInString) +
                            BigInt(currentBid.quantity) *
                            BigInt(createOrderData.price);
                        await redisClient.set(
                            createOrderData.userId + "token",
                            newTokenOfAsker.toString()
                        );
                        const prevOrdersOfAsker = (await redisClient.get(
                            "orderPresent" + "solana" + createOrderData.userId
                        )) as string;
                        await redisClient.set(
                            "orderPresent" + "solana" + createOrderData.userId,
                            (parseInt(prevOrdersOfAsker) - 1).toString()
                        );
                        const prevSolanaOfBidder = (await redisClient.get(
                            currentBid.userId + "solana"
                        )) as string;
                        await redisClient.set(
                            currentBid.userId + "solana",
                            (
                                BigInt(prevSolanaOfBidder) +
                                BigInt(currentBid.quantity)
                            ).toString()
                        );
                        const prevTokensOfBidder = (await redisClient.get(
                            currentBid.userId + "token"
                        )) as string;
                        const tokensToRemove =
                            BigInt(currentBid.price) *
                            BigInt(currentBid.quantity);
                        await redisClient.set(
                            currentBid.userId + "token",
                            (
                                BigInt(prevTokensOfBidder) - tokensToRemove
                            ).toString()
                        );
                        await redisClient.lPush(
                            "dbUpdateBalance",
                            currentBid.userId
                        );
                    } else if (
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity) <
                        BigInt(currentBid.quantity)
                    ) {
                        filledCompletely = true;
                        const prevSolanaHoldingsOfAsker =
                            (await redisClient.get(
                                createOrderData.userId + "solana"
                            )) as string;
                        await redisClient.set(
                            createOrderData.userId + "solana",
                            (
                                BigInt(prevSolanaHoldingsOfAsker) -
                                (BigInt(createOrderData.quantity) -
                                    filledQuantity)
                            ).toString()
                        );
                        const prevTokenOfAskerInString = await getUserBalance(
                            createOrderData.userId,
                            "token"
                        );
                        const newTokenOfAsker =
                            BigInt(prevTokenOfAskerInString) +
                            BigInt(createOrderData.quantity) *
                            BigInt(createOrderData.price);
                        await redisClient.set(
                            createOrderData.userId + "token",
                            newTokenOfAsker.toString()
                        );
                        const prevOrdersOfAsker = (await redisClient.get(
                            "orderPresent" + "solana" + createOrderData.userId
                        )) as string;
                        await redisClient.set(
                            "orderPresent" + "solana" + createOrderData.userId,
                            (parseInt(prevOrdersOfAsker) - 1).toString()
                        );
                        const prevSolanaOfBidder = (await redisClient.get(
                            currentBid.userId + "solana"
                        )) as string;
                        await redisClient.set(
                            currentBid.userId + "solana",
                            (
                                BigInt(prevSolanaOfBidder) +
                                (BigInt(createOrderData.quantity) -
                                    filledQuantity)
                            ).toString()
                        );
                        const prevTokensOfBidder = (await redisClient.get(
                            currentBid.userId + "token"
                        )) as string;
                        const tokensToRemove =
                            BigInt(currentBid.price) *
                            (BigInt(createOrderData.quantity) - filledQuantity);
                        await redisClient.set(
                            currentBid.userId + "token",
                            (
                                BigInt(prevTokensOfBidder) - tokensToRemove
                            ).toString()
                        );
                        await redisClient.lPush(
                            "dbUpdateBalance",
                            currentBid.userId
                        );
                        filledQuantity = BigInt(createOrderData.quantity);
                    } else {
                        filledQuantity += BigInt(currentBid.quantity);
                        const prevSolanaHoldingsOfAskerInString =
                            (await redisClient.get(
                                createOrderData.userId + "solana"
                            )) as string;
                        await redisClient.set(
                            createOrderData.userId + "solana",
                            (
                                BigInt(prevSolanaHoldingsOfAskerInString) -
                                BigInt(currentBid.quantity)
                            ).toString()
                        );
                        const prevTokenHoldingOfAskerInString =
                            (await redisClient.get(
                                createOrderData.userId + "token"
                            )) as string;
                        await redisClient.set(
                            createOrderData.userId + "token",
                            (
                                BigInt(prevTokenHoldingOfAskerInString) +
                                BigInt(createOrderData.price) *
                                BigInt(currentBid.quantity)
                            ).toString()
                        );
                        const prevSolanaOfBidder = (await redisClient.get(
                            currentBid.userId + "solana"
                        )) as string;
                        await redisClient.set(
                            currentBid.userId + "solana",
                            (
                                BigInt(prevSolanaOfBidder) +
                                BigInt(currentBid.quantity)
                            ).toString()
                        );
                        const prevTokensOfBidder = (await redisClient.get(
                            currentBid.userId + "token"
                        )) as string;
                        await redisClient.set(
                            currentBid.userId + "token",
                            (
                                BigInt(prevTokensOfBidder) -
                                BigInt(currentBid.quantity) *
                                BigInt(currentBid.price)
                            ).toString()
                        );
                        await redisClient.lPush(
                            "dbUpdateBalance",
                            currentBid.userId
                        );
                    }
                }
            }
            await redisClient.lPush("dbUpdateBalance", createOrderData.userId);
            // @ts-ignore
            this.orderBooks.get(createOrderData.market).bids = latestBids;
            if (!filledCompletely) {
                // @ts-ignore
                this.orderBooks.get(createOrderData.market).bids.push({
                    price: createOrderData.price,
                    userId: createOrderData.userId,
                    orderId: createOrderData.orderId,
                    quantity: (
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity)
                    ).toString(),
                });
            } else {
                const prevOrderNumbers = (await redisClient.get(
                    "orderPresent" + "solana" + createOrderData.userId
                )) as string;
                await redisClient.set(
                    "orderPresent" + "solana" + createOrderData.userId,
                    (BigInt(prevOrderNumbers) - BigInt(1)).toString()
                );
            }
            console.log("Asks after");
            console.log(orderBook.asks);
            console.log("bids after");
            console.log(orderBook.bids);
        }
        return {
            marketFound: true,
            balanceNotEnough: false,
            userBalanceFound: true,
            invalidData: false,
            success: true,
        };
    }

    public async deleteOrder(
        deleteOrderData: DeleteOrderRequest
    ): Promise<DeleteOrderResponse> {
        const redisManager = await RedisManager.getInstance();
        const redisClient = redisManager.client;
        const { userId, orderId, kind, market } = deleteOrderData;
        if (!userId || !orderId || !kind || !market) {
            return {
                success: false,
            };
        }
        if (kind == "buy") {
            const newBids = [];
            const orderBook = this.orderBooks.get(market);
            if (!orderBook) {
                return {
                    success: false,
                };
            }
            console.log("Asks before");
            console.log(orderBook.asks);
            console.log("bids before");
            console.log(orderBook.bids);
            let oldBids = orderBook.bids;
            let requiredOrder;
            for (let i = 0; i < oldBids.length; i++) {
                const curOrder = oldBids[i];
                if (curOrder.orderId != orderId) {
                    newBids.push(curOrder);
                } else {
                    requiredOrder = curOrder;
                }
            }
            if (!requiredOrder) {
                return {
                    success: false,
                };
            }
            if (requiredOrder.userId != userId) {
                return {
                    success: false,
                };
            }
            // @ts-ignore
            this.orderBooks.get(market)?.bids = newBids;
            const prevOrderCount = (await redisClient.get(
                "orderPresent" + "token" + userId
            )) as string;
            await redisClient.set(
                "orderPresent" + "token" + userId,
                (BigInt(prevOrderCount) - BigInt(1)).toString()
            );
        } else if (kind == "ask") {
            const newAsks = [];
            const orderBook = this.orderBooks.get(market);
            if (!orderBook) {
                return {
                    success: false,
                };
            }
            console.log("Asks before");
            console.log(orderBook.asks);
            console.log("bids before");
            console.log(orderBook.bids);

            let oldAsks = orderBook.asks;
            let requiredOrder;
            for (let i = 0; i < oldAsks.length; i++) {
                const curOrder = oldAsks[i];
                if (curOrder.orderId != orderId) {
                    newAsks.push(curOrder);
                } else {
                    requiredOrder = curOrder;
                }
            }
            if (!requiredOrder) {
                return {
                    success: false,
                };
            }
            if (requiredOrder.userId != userId) {
                return {
                    success: false,
                };
            }
            // @ts-ignore
            this.orderBooks.get(market)?.asks = newAsks;
            const prevOrderCount = (await redisClient.get(
                "orderPresent" + "solana" + userId
            )) as string;
            await redisClient.set(
                "orderPresent" + "solana" + userId,
                (BigInt(prevOrderCount) - BigInt(1)).toString()
            );
            console.log("Asks after");
            console.log(orderBook.asks);
            console.log("bids after");
            console.log(orderBook.bids);
        }
        return {
            success: true,
        };
    }
}
