import { OrderBook } from "../interfaces/orderBookInterfaces";

export class OrderBooksManager {
    public orderBooks: Map<String, OrderBook>;
    private static instance: OrderBooksManager;

    private constructor() {
        this.orderBooks = new Map();
        this.orderBooks.set("SOL_TOKEN", { asks: [], bids: [] });
    }

    static getInstance(): OrderBooksManager {
        if (!OrderBooksManager.instance) {
            OrderBooksManager.instance = new OrderBooksManager();
        }
        return OrderBooksManager.instance;
    }
}
