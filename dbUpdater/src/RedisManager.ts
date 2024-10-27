import { createClient, RedisClientType } from "redis";

export class RedisManager {
    private static instance: RedisManager;
    public client: RedisClientType;
    private constructor() {
        this.client = createClient();
    }

    static async getInstance(): Promise<RedisManager> {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager();
        }
        if (!RedisManager.instance.client.isOpen || !RedisManager.instance.client.isReady) {
            await RedisManager.instance.client.connect();
        }
        return RedisManager.instance;
    }
}
