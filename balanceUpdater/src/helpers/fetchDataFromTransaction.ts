import { ConfirmedSignatureInfo, ParsedInstruction } from "@solana/web3.js";
import { connection } from "..";
import { accountPublicKey, mintAddress, tokenWalletAddress } from "../constants/constants";
import { db } from "../db";
import { AccountTable, LastTransactionUsed, UserTokenBalance } from "../db/schema";
import { eq } from "drizzle-orm";
import { client } from "../redis";


export const extractAndUpdateData = async (signature: ConfirmedSignatureInfo[]) => {
    const errorFreeTransactions = signature.filter((sign) => sign.confirmationStatus == "finalized" && sign.err == null).map((sign) => sign.signature);
    const transactions = await connection.getParsedTransactions(errorFreeTransactions);
    for(let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        if(!transaction || !transaction.transaction.message.instructions[2] || transaction.meta?.err) {
            continue;
        }
        const parsedData = transaction.transaction.message.instructions[2] as ParsedInstruction;
        if(parsedData.parsed.type == "transfer") {
            // update solana balance here
            if(parsedData.parsed.info.destination == accountPublicKey) {
                try {
                    const sentAmount = parsedData.parsed.info.lamports;
                    const userAccountTokenBalance = await db.select().from(AccountTable).leftJoin(
                        UserTokenBalance,
                        eq(UserTokenBalance.accountId, AccountTable.id)
                    ).where(eq(
                        AccountTable.publicKey, parsedData.parsed.info.source
                    ));
                    if(userAccountTokenBalance.length == 0 || !userAccountTokenBalance[0].UserBalance) {
                        continue;
                    } else {
                        // update db
                        const newBalance: BigInt = BigInt(sentAmount) + BigInt(userAccountTokenBalance[0].UserBalance.solanaBalanceLamports);
                        await db.update(UserTokenBalance).set({
                            solanaBalanceLamports: newBalance.toString()
                        }).where(eq(UserTokenBalance.id, userAccountTokenBalance[0].UserBalance.id));
                        // update redis
                        await client.set(userAccountTokenBalance[0].Account.userId + "solana",
                            newBalance.toString());
                    }
                } catch(err) {
                    console.log(err);
                    await client.SET("transactionUsedLast", errorFreeTransactions[i]);
                    await db.update(LastTransactionUsed).set({
                        lastTransactionUsed: errorFreeTransactions[i]
                    });
                    process.exit(1);
                }
            }
        } else if(parsedData.parsed.type == "transferChecked") {
            // update token mint balance here
            if(parsedData.parsed.info.destination == tokenWalletAddress && parsedData.parsed.info.mint == mintAddress) {
                // i received some tokens update here
                try {
                    const sentAmount = parsedData.parsed.info.tokenAmount.amount;
                    const userAccountTokenBalance = await db.select().from(AccountTable).leftJoin(
                        UserTokenBalance,
                        eq(UserTokenBalance.accountId, AccountTable.id)
                    ).where(eq(
                        AccountTable.publicKey, parsedData.parsed.info.signers[0]
                    ));
                    if(userAccountTokenBalance.length == 0 || !userAccountTokenBalance[0].UserBalance) {
                        continue;
                    } else {
                        // update db
                        const newBalance: BigInt = BigInt(sentAmount) + BigInt(userAccountTokenBalance[0].UserBalance.tokenBalanceLamports);
                        await db.update(UserTokenBalance).set({
                            tokenBalanceLamports: newBalance.toString()
                        }).where(eq(UserTokenBalance.id, userAccountTokenBalance[0].UserBalance.id));
                        // update redis
                        await client.set(userAccountTokenBalance[0].Account.userId + "token", newBalance.toString());
                    }
                } catch(err) {
                    console.log(err);
                    await client.SET("transactionUsedLast", errorFreeTransactions[i]);
                    await db.update(LastTransactionUsed).set({
                        lastTransactionUsedToken: errorFreeTransactions[i]
                    });
                    process.exit(1);
                }

            }
        }
    }
}
