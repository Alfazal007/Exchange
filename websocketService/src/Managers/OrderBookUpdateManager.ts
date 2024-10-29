import { WebSocket } from "ws";

interface User {
    connection: WebSocket,
}

interface MessageType {
    method: "subscribe" | "unsubscribe",
    token: string
}

export class OrderBookHandler {
    private static instance: OrderBookHandler;
    public usersSolToken: User[];
    private userSetSolToken: Set<WebSocket>

    constructor() {
        this.usersSolToken = [];
        this.userSetSolToken = new Set();
    }

    public static getInstance(): OrderBookHandler {
        if (!OrderBookHandler.instance) {
            OrderBookHandler.instance = new OrderBookHandler();
        }
        return OrderBookHandler.instance;
    }

    public addHandlers(ws: WebSocket) {
        ws.on("message", async (data) => {
            let message: MessageType;
            try {
                message = JSON.parse(data.toString());
            } catch (err) {
                ws.send(JSON.stringify({
                    message: "invalid payload"
                }));
                return;
            }
            if (message.method == "subscribe" && message.token == "SOL_TOKEN") {
                if (this.userSetSolToken.has(ws)) {
                    return;
                }
                this.userSetSolToken.add(ws);
                this.usersSolToken.push({
                    connection: ws
                });
            }
            else if (message.method == "unsubscribe" && message.token == "SOL_TOKEN") {
                if (!this.userSetSolToken.has(ws)) {
                    return;
                }
                this.userSetSolToken.delete(ws);
                let latestUsers = this.usersSolToken.filter((user) => user.connection != ws);
                this.usersSolToken = latestUsers;
            }
        });

        ws.on("error", () => {
            if (!this.userSetSolToken.has(ws)) {
                return;
            }
            this.userSetSolToken.delete(ws);
            let latestUsers = this.usersSolToken.filter((user) => user.connection != ws);
            this.usersSolToken = latestUsers;
            ws.close();
        });

        ws.on("close", () => {
            if (!this.userSetSolToken.has(ws)) {
                return;
            }
            this.userSetSolToken.delete(ws);
            let latestUsers = this.usersSolToken.filter((user) => user.connection != ws);
            this.usersSolToken = latestUsers;
        });
    }
}
