import { createClient } from "redis"

async function main() {
    const client = createClient();
    await client.connect();
    while (true) {
        const data = await client.brPop("dbUpdateBalance", 0);
        console.log({ data });
    }
}



main()
