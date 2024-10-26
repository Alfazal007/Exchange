import { createClient, RedisClientType } from "redis";

class RedisManager {
    private static instance: RedisManager;
    private publisher: RedisClientType;
    private queue: RedisClientType;

    private constructor() {
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
        return new Promise<string>((resolve) => {
            if (!this.publisher.isOpen || !this.publisher.isReady) {
                console.log(this.publisher.isOpen);
                console.log(this.publisher.isReady);
                this.publisher.connect().then(() => { }).catch((err) => { console.log("error with publisger", err) });
            }
            this.publisher.subscribe(idToSubscribe, (message) => {
                console.log({ message });
                this.publisher.unsubscribe(idToSubscribe);
                resolve(message);
            });
            if (!this.queue.isOpen || !this.queue.isReady) {
                console.log(this.queue.isOpen);
                console.log(this.queue.isReady);
                this.queue.connect().then(() => { }).catch((err) => { console.log("error with publisger", err) });
            }
            this.queue.lPush("orders", data);
        });
    }
}


export {
    RedisManager
}
