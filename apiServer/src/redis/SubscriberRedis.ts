import { createClient, RedisClientType } from "redis";

class RedisManager {
    private static instance: RedisManager;
    private publisher: RedisClientType;
    private queue: RedisClientType;

    constructor() {
        this.queue = createClient();
        this.queue.connect();
        this.publisher = createClient();
        this.publisher.connect();
    }

    public static getInstance(): RedisManager {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public publishAndWaitForMessage(data: string, idToSubscribe: string) {
        console.log({ idToSubscribe });
        return new Promise<string>((resolve) => {
            this.publisher.subscribe(idToSubscribe, (message) => {
                this.publisher.unsubscribe(idToSubscribe);
                resolve(message);
            });
            this.queue.lPush("orders", data);
        });
    }
}


export {
    RedisManager
}
