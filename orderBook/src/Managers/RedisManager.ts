import { createClient, RedisClientType } from "redis";

export class RedisManager {
    public publisher: RedisClientType;
    public client: RedisClientType;
    private static instace: RedisManager;

    public constructor() {
        this.publisher = createClient();
        this.publisher.connect();
        this.client = createClient();
        this.client.connect();
    }

    public static getInstance(): RedisManager {
        if (!this.instace) {
            this.instace = new RedisManager();
        }
        return this.instace;
    }
}
