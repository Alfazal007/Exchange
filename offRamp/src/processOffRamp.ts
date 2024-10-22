import { eq } from "drizzle-orm";
import { db } from "./db";
import { AccountTable, UserTable, UserTokenBalance } from "./db/schema";
import { ASKINGTOOMUCH, NOTENOUGHSOL } from "./constants";
import { error } from "console";

export async function processOfframp(offrampStringData: string) {
    const {userId, token, amount} = JSON.parse(offrampStringData);
    if(!userId || !token || !amount) {
        return;
    }
    if(token != "solana" && token != "token") {
        return;
    }
    try {
        let errorMessage = "";
        const amountToBeOffRamped = BigInt(amount);
        await db.transaction(async (tx) => {
            const userAccountAndBalance = await db.select().from(UserTable)
                .leftJoin(AccountTable, eq(AccountTable.userId, UserTable.id))
                .leftJoin(UserTokenBalance, eq(UserTokenBalance.userId, UserTable.id))
                .where(eq(UserTable.id, userId));
            if(!userAccountAndBalance || userAccountAndBalance.length == 0 || !userAccountAndBalance[0].User || !userAccountAndBalance[0].Account || !userAccountAndBalance[0].UserBalance) {
                tx.rollback();
                return;
            }
            if(userAccountAndBalance[0].UserBalance.solanaBalanceLamports == "0") {
                errorMessage = NOTENOUGHSOL;
                return;
            }
            if(token == "solana" && BigInt(userAccountAndBalance[0].UserBalance.solanaBalanceLamports) < amount) {
                errorMessage = ASKINGTOOMUCH;
            }
            if(token == "token" && BigInt(userAccountAndBalance[0].UserBalance.tokenBalanceLamports) < amount) {
                errorMessage = ASKINGTOOMUCH;
            }
        });
    } catch(err) {
        console.log("Database error ", err);
    }
    // find the user account along with his balance
    // check if he has enough money to be taken out
    // check if he has enough sol to pay for gas
    // send the user the tokens - gas
}
