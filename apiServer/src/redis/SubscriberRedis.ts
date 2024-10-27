import { createClient, RedisClientType } from "redis";

class RedisManager {
    private static instance: RedisManager;
    public publisher: RedisClientType;
    public client: RedisClientType;

    private constructor() {
        this.client = createClient();
        this.publisher = createClient();
    }

    static async getInstance(): Promise<RedisManager> {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager();
        }
        if (!RedisManager.instance.publisher.isOpen || !RedisManager.instance.publisher.isReady) {
            await RedisManager.instance.publisher.connect();
        }
        if (!RedisManager.instance.client.isOpen || !RedisManager.instance.client.isReady) {
            await RedisManager.instance.client.connect();
        }
        return RedisManager.instance;
    }

    public publishAndWaitForMessage(data: string, idToSubscribe: string) {
        return new Promise<string>((resolve) => {
            if (!this.publisher.isOpen || !this.publisher.isReady) {
                console.log(this.publisher.isOpen);
                console.log(this.publisher.isReady);
                this.publisher.connect().then(() => { }).catch((err) => { console.log("error with publisger", err) });
            }
            this.publisher.subscribe(idToSubscribe, (message) => {
                this.publisher.unsubscribe(idToSubscribe);
                resolve(message);
            });
            if (!this.client.isOpen || !this.client.isReady) {
                this.client.connect().then(() => { }).catch((err) => { console.log("error with publisger", err) });
            }
            this.client.lPush("orders", data);
        });
    }
}


export {
    RedisManager
}
