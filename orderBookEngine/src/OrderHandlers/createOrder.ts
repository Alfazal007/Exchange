import { Ask, Bid } from "../interfaces/orderBookInterfaces";
import { CreateOrderRequest } from "../interfaces/RequestInterfaces"
import { CreateOrderResponse } from "../interfaces/ResponseInterfaces"
import { OrderBooksManager } from "../Managers/OrderBookManager";
import { RedisManager } from "../Managers/RedisManager";

export async function createOrder(createOrderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    const { market } = createOrderData;
    const orderBookManager = OrderBooksManager.getInstance();
    const orderBookMap = orderBookManager.orderBooks;
    const orderBook = orderBookMap.get(market);
    if (!orderBook) {
        return {
            success: false,
            invalidData: false,
            marketFound: false,
            balanceNotEnough: false,
            userBalanceFound: false
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
            success: false,
        };
    }
    if (createOrderData.kind == "buy") {
        const redisManager = await RedisManager.getInstance();
        const balanceOfBuyerInToken = await redisManager.client.get(createOrderData.userId + "token");
        const balanceOfBuyerInSolana = await redisManager.client.get(createOrderData.userId + "solana");
        if (!balanceOfBuyerInToken || balanceOfBuyerInToken == "") {
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
            userBalance = BigInt(balanceOfBuyerInToken);
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
        if (userBalance < requiredBalance) {
            return {
                marketFound: true,
                userBalanceFound: true,
                invalidData: false,
                balanceNotEnough: true,
                success: false,
            };
        }
        const orderBook = orderBookMap.get("SOL_TOKEN");
        const asks = orderBook?.asks as Ask[];
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
                        (await redisManager.client.get(
                            currentAsk.userId + "solana"
                        )) as string;
                    await redisManager.client.set(
                        currentAsk.userId + "solana",
                        (
                            BigInt(prevSolanaHoldingsOfAsker) -
                            BigInt(currentAsk.quantity)
                        ).toString()
                    );
                    const prevTokenOfAskerInString = await redisManager.client.get(
                        currentAsk.userId +
                        "token"
                    ) as string;
                    const newTokenOfAsker =
                        BigInt(prevTokenOfAskerInString) + (
                            BigInt(currentAsk.quantity) *
                            BigInt(currentAsk.price));
                    await redisManager.client.set(
                        currentAsk.userId + "token",
                        newTokenOfAsker.toString()
                    );
                    const prevOrdersOfAskerCount = (await redisManager.client.get(
                        "orderPresent" + "solana" + currentAsk.userId
                    )) as string;
                    await redisManager.client.set(
                        "orderPresent" + "solana" + currentAsk.userId,
                        (parseInt(prevOrdersOfAskerCount) - 1).toString()
                    );
                    const prevSolanaOfBidder = (await redisManager.client.get(
                        createOrderData.userId + "solana"
                    )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "solana",
                        (
                            BigInt(prevSolanaOfBidder) +
                            BigInt(currentAsk.quantity)
                        ).toString()
                    );
                    const prevTokensOfBidder = (await redisManager.client.get(
                        createOrderData.userId + "token"
                    )) as string;
                    const tokensToRemove =
                        limit * BigInt(currentAsk.quantity);
                    await redisManager.client.set(
                        createOrderData.userId + "token",
                        (
                            BigInt(prevTokensOfBidder) - tokensToRemove
                        ).toString()
                    );
                    await redisManager.client.lPush(
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
                        (await redisManager.client.get(
                            currentAsk.userId + "solana"
                        )) as string;
                    await redisManager.client.set(
                        currentAsk.userId + "solana",
                        (
                            BigInt(prevSolanaHoldingsOfAsker) -
                            BigInt(currentAsk.quantity)
                        ).toString()
                    );
                    const prevTokenOfAskerInString = await redisManager.client.get(
                        currentAsk.userId +
                        "token"
                    ) as string;
                    const newTokenOfAsker =
                        BigInt(prevTokenOfAskerInString) + (
                            BigInt(currentAsk.quantity) *
                            BigInt(currentAsk.price));
                    await redisManager.client.set(
                        currentAsk.userId + "token",
                        newTokenOfAsker.toString()
                    );
                    const prevOrdersOfAskerCount = (await redisManager.client.get(
                        "orderPresent" + "solana" + currentAsk.userId
                    )) as string;
                    await redisManager.client.set(
                        "orderPresent" + "solana" + currentAsk.userId,
                        (parseInt(prevOrdersOfAskerCount) - 1).toString()
                    );
                    const prevSolanaOfBidder = (await redisManager.client.get(
                        createOrderData.userId + "solana"
                    )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "solana",
                        (
                            BigInt(prevSolanaOfBidder) +
                            BigInt(currentAsk.quantity)
                        ).toString()
                    );
                    const prevTokensOfBidder = (await redisManager.client.get(
                        createOrderData.userId + "token"
                    )) as string;
                    const tokensToRemove =
                        limit * BigInt(currentAsk.quantity);
                    await redisManager.client.set(
                        createOrderData.userId + "token",
                        (
                            BigInt(prevTokensOfBidder) - tokensToRemove
                        ).toString()
                    );
                    await redisManager.client.lPush(
                        "dbUpdateBalance",
                        currentAsk.userId
                    );
                } else {
                    const quantityToBeFilled =
                        BigInt(createOrderData.quantity) - filledQuantity;
                    filledQuantity = BigInt(createOrderData.quantity);
                    const prevSolanaHoldingsOfAskerInString =
                        (await redisManager.client.get(
                            currentAsk.userId + "solana"
                        )) as string;
                    await redisManager.client.set(
                        currentAsk.userId + "solana",
                        (
                            BigInt(prevSolanaHoldingsOfAskerInString) -
                            quantityToBeFilled
                        ).toString()
                    );
                    const prevTokenHoldingOfAskerInString =
                        (await redisManager.client.get(
                            currentAsk.userId + "token"
                        )) as string;
                    await redisManager.client.set(
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
                    const prevSolanaOfBidder = (await redisManager.client.get(
                        createOrderData.userId + "solana"
                    )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "solana",
                        (
                            BigInt(prevSolanaOfBidder) + quantityToBeFilled
                        ).toString()
                    );
                    const prevTokensOfBidder = (await redisManager.client.get(
                        createOrderData.userId + "token"
                    )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "token",
                        (
                            BigInt(prevTokensOfBidder) - (
                                quantityToBeFilled *
                                BigInt(createOrderData.limit))
                        ).toString()
                    );
                    filledCompletely = true;
                    await redisManager.client.lPush(
                        "dbUpdateBalance",
                        currentAsk.userId
                    );
                }
            }
        }
        await redisManager.client.lPush(
            "dbUpdateBalance",
            createOrderData.userId
        );
        if (orderBook?.asks) {
            latestAsks.sort((a, b) => Number(BigInt(a.price) - BigInt(b.price)));
            orderBook.asks = latestAsks;
        }
        if (!filledCompletely) {
            if (orderBook?.bids) {
                orderBook.bids.push({
                    price: createOrderData.limit,
                    userId: createOrderData.userId,
                    orderId: createOrderData.orderId,
                    quantity: (
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity)
                    ).toString(),
                });
            }
        } else {
            const prevOrderNumbers = (await redisManager.client.get(
                "orderPresent" + "token" + createOrderData.userId
            )) as string;
            await redisManager.client.set(
                "orderPresent" + "token" + createOrderData.userId,
                (BigInt(prevOrderNumbers) - BigInt(1)).toString()
            );
        }
    } else if (createOrderData.kind == "ask") {
        const redisManager = await RedisManager.getInstance();
        const userBalanceInString = await redisManager.client.get(
            createOrderData.userId +
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
        let latestBids: Bid[] = [];
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
                        (await redisManager.client.get(
                            createOrderData.userId + "solana"
                        )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "solana",
                        (
                            BigInt(prevSolanaHoldingsOfAsker) -
                            BigInt(currentBid.quantity)
                        ).toString()
                    );
                    const prevTokenOfAskerInString = await redisManager.client.get(
                        createOrderData.userId +
                        "token"
                    ) as string;
                    const newTokenOfAsker =
                        BigInt(prevTokenOfAskerInString) + (
                            BigInt(currentBid.quantity) *
                            BigInt(createOrderData.price));
                    await redisManager.client.set(
                        createOrderData.userId + "token",
                        newTokenOfAsker.toString()
                    );
                    const prevSolanaOfBidder = (await redisManager.client.get(
                        currentBid.userId + "solana"
                    )) as string;
                    await redisManager.client.set(
                        currentBid.userId + "solana",
                        (
                            BigInt(prevSolanaOfBidder) +
                            BigInt(currentBid.quantity)
                        ).toString()
                    );
                    const prevTokensOfBidder = (await redisManager.client.get(
                        currentBid.userId + "token"
                    )) as string;
                    const tokensToRemove =
                        BigInt(currentBid.price) *
                        BigInt(currentBid.quantity);
                    await redisManager.client.set(
                        currentBid.userId + "token",
                        (
                            BigInt(prevTokensOfBidder) - tokensToRemove
                        ).toString()
                    );
                    const prevOrderCountOfAsker = (await redisManager.client.get(
                        "orderPresent" + "token" + currentBid.userId
                    )) as string;
                    await redisManager.client.set(
                        "orderPresent" + "token" + currentBid.userId,
                        (parseInt(prevOrderCountOfAsker) - 1).toString()
                    );
                    await redisManager.client.lPush(
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
                        (await redisManager.client.get(
                            createOrderData.userId + "solana"
                        )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "solana",
                        (
                            BigInt(prevSolanaHoldingsOfAsker) -
                            (BigInt(createOrderData.quantity) -
                                filledQuantity)
                        ).toString()
                    );
                    const prevTokenOfAskerInString = await redisManager.client.get(
                        createOrderData.userId +
                        "token"
                    ) as string;
                    const newTokenOfAsker =
                        BigInt(prevTokenOfAskerInString) + (
                            (BigInt(createOrderData.quantity) - BigInt(filledQuantity)) *
                            BigInt(createOrderData.price));
                    await redisManager.client.set(
                        createOrderData.userId + "token",
                        newTokenOfAsker.toString()
                    );
                    const prevSolanaOfBidder = (await redisManager.client.get(
                        currentBid.userId + "solana"
                    )) as string;
                    await redisManager.client.set(
                        currentBid.userId + "solana",
                        (
                            BigInt(prevSolanaOfBidder) +
                            (BigInt(createOrderData.quantity) -
                                filledQuantity)
                        ).toString()
                    );
                    const prevTokensOfBidder = (await redisManager.client.get(
                        currentBid.userId + "token"
                    )) as string;
                    const tokensToRemove =
                        BigInt(currentBid.price) *
                        (BigInt(createOrderData.quantity) - filledQuantity);
                    await redisManager.client.set(
                        currentBid.userId + "token",
                        (
                            BigInt(prevTokensOfBidder) - tokensToRemove
                        ).toString()
                    );
                    await redisManager.client.lPush(
                        "dbUpdateBalance",
                        currentBid.userId
                    );
                    latestBids.push({
                        orderId: currentBid.orderId,
                        userId: currentBid.userId,
                        price: currentBid.price,
                        quantity: (BigInt(currentBid.quantity) - (BigInt(createOrderData.quantity) - filledQuantity)).toString()
                    });
                    filledQuantity = BigInt(createOrderData.quantity);
                } else {
                    filledQuantity += BigInt(currentBid.quantity);
                    const prevSolanaHoldingsOfAskerInString =
                        (await redisManager.client.get(
                            createOrderData.userId + "solana"
                        )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "solana",
                        (
                            BigInt(prevSolanaHoldingsOfAskerInString) -
                            BigInt(currentBid.quantity)
                        ).toString()
                    );
                    const prevTokenHoldingOfAskerInString =
                        (await redisManager.client.get(
                            createOrderData.userId + "token"
                        )) as string;
                    await redisManager.client.set(
                        createOrderData.userId + "token",
                        (
                            BigInt(prevTokenHoldingOfAskerInString) +
                            BigInt(createOrderData.price) *
                            BigInt(currentBid.quantity)
                        ).toString()
                    );
                    const prevSolanaOfBidder = (await redisManager.client.get(
                        currentBid.userId + "solana"
                    )) as string;
                    await redisManager.client.set(
                        currentBid.userId + "solana",
                        (
                            BigInt(prevSolanaOfBidder) +
                            BigInt(currentBid.quantity)
                        ).toString()
                    );
                    const prevTokensOfBidder = (await redisManager.client.get(
                        currentBid.userId + "token"
                    )) as string;
                    await redisManager.client.set(
                        currentBid.userId + "token",
                        (
                            BigInt(prevTokensOfBidder) - (
                                BigInt(currentBid.quantity) *
                                BigInt(currentBid.price))
                        ).toString()
                    );
                    const prevOrderCountOfAsker = (await redisManager.client.get(
                        "orderPresent" + "token" + currentBid.userId
                    )) as string;
                    await redisManager.client.set(
                        "orderPresent" + "token" + currentBid.userId,
                        (parseInt(prevOrderCountOfAsker) - 1).toString()
                    );
                    await redisManager.client.lPush(
                        "dbUpdateBalance",
                        currentBid.userId
                    );
                }
            }
        }
        // outside for loop
        await redisManager.client.lPush("dbUpdateBalance", createOrderData.userId);
        if (orderBook?.bids) {
            latestBids.sort((a, b) => Number(BigInt(b.price) - BigInt(a.price)));
            orderBook.bids = latestBids;
        }
        if (!filledCompletely) {
            if (orderBook?.asks) {
                orderBook.asks.push({
                    price: createOrderData.limit,
                    userId: createOrderData.userId,
                    orderId: createOrderData.orderId,
                    quantity: (
                        BigInt(createOrderData.quantity) -
                        BigInt(filledQuantity)
                    ).toString(),
                })
            }
        } else {
            const prevOrderNumbers = (await redisManager.client.get(
                "orderPresent" + "solana" + createOrderData.userId
            )) as string;
            await redisManager.client.set(
                "orderPresent" + "solana" + createOrderData.userId,
                (BigInt(prevOrderNumbers) - BigInt(1)).toString()
            );
        }
    }
    return {
        success: true,
        invalidData: false,
        marketFound: false,
        balanceNotEnough: false,
        userBalanceFound: false
    }
}
