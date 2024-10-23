import { eq } from "drizzle-orm";
import { db } from "./db";
import { AccountTable, UserTable, UserTokenBalance } from "./db/schema";
import { ASKINGTOOMUCH, ESTIMATEDFEESNOTTHERE, FatWalletPubKey, FATWALLETTOKENADDRESS, NOTENOUGHSOL, TOKENMINT } from "./constants";
import { Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { connection } from ".";
import bs58 from "bs58";
import { envVariables } from "./envVariables";
import { client } from "./redis";
import  { createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

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
            if(token == "solana" && BigInt(userAccountAndBalance[0].UserBalance.solanaBalanceLamports) < amountToBeOffRamped) {
                errorMessage = ASKINGTOOMUCH;
            }
            if(token == "token" && BigInt(userAccountAndBalance[0].UserBalance.tokenBalanceLamports) < amountToBeOffRamped) {
                errorMessage = ASKINGTOOMUCH;
            }
            if(token == "solana") {
                const transaction = new Transaction();
                transaction.add(SystemProgram.transfer({
                    toPubkey: new PublicKey(userAccountAndBalance[0].Account.publicKey),
                    lamports: amountToBeOffRamped,
                    fromPubkey: new PublicKey(FatWalletPubKey)
                }));
                const feesToBePaid = await transaction.getEstimatedFee(connection);
                if(!feesToBePaid) {
                    errorMessage = ESTIMATEDFEESNOTTHERE;
                    tx.rollback();
                    return;
                }
                if(amountToBeOffRamped + BigInt(feesToBePaid) >= BigInt(userAccountAndBalance[0].UserBalance.solanaBalanceLamports)) {
                    errorMessage = ASKINGTOOMUCH;
                    tx.rollback();
                    return;
                }
                const signer = Keypair.fromSecretKey(bs58.decode(envVariables.secretKey));
                const transactionSignature = await sendAndConfirmTransaction(connection, transaction, [signer]);
                const transactionDetails = await connection.getTransaction(transactionSignature, {
                    commitment: 'confirmed'
                });
                const fees = transactionDetails?.meta?.fee || feesToBePaid;
                // update cache and DB
                const finalAmount = BigInt(userAccountAndBalance[0].UserBalance.solanaBalanceLamports) - amountToBeOffRamped - BigInt(fees);
                await db.update(UserTokenBalance).set({
                    solanaBalanceLamports: finalAmount.toString()
                }).where(eq(UserTokenBalance.userId, userAccountAndBalance[0].User.id));
                await client.set(userAccountAndBalance[0].User.id+"solana", finalAmount.toString());
            } else if(token == "token") {
                const tokenMint = new PublicKey(TOKENMINT);
                const transaction = new Transaction();
                const signer = Keypair.fromSecretKey(bs58.decode(envVariables.secretKey));
                const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(connection, signer, tokenMint, new PublicKey(userAccountAndBalance[0].Account.publicKey));
                const instruction = createTransferInstruction(new PublicKey(FATWALLETTOKENADDRESS), receiverTokenAccount.address, new PublicKey(FatWalletPubKey), amountToBeOffRamped);
                transaction.add(instruction);
                const feesToBePaid = await transaction.getEstimatedFee(connection);
                if(!feesToBePaid) {
                    errorMessage = ESTIMATEDFEESNOTTHERE;
                    tx.rollback();
                    return;
                }
                if(BigInt(feesToBePaid) >= BigInt(userAccountAndBalance[0].UserBalance.solanaBalanceLamports)) {
                    errorMessage = ASKINGTOOMUCH;
                    tx.rollback();
                    return;
                }
                const signature = await sendAndConfirmTransaction(connection, transaction, [signer]);
                const transactionDetails = await connection.getTransaction(signature, {
                    commitment: 'confirmed'
                });
                const fees = transactionDetails?.meta?.fee || feesToBePaid;
                const updatedSolBalance = BigInt(userAccountAndBalance[0].UserBalance.solanaBalanceLamports) - BigInt(fees);
                const updatedTokenBalance = BigInt(userAccountAndBalance[0].UserBalance.tokenBalanceLamports) - amountToBeOffRamped;
                await db.update(UserTokenBalance).set({
                    solanaBalanceLamports: updatedSolBalance.toString(),
                    tokenBalanceLamports: updatedTokenBalance.toString()
                }).where(eq(
                    UserTokenBalance.userId, userAccountAndBalance[0].User.id
                ));
                await client.set(userAccountAndBalance[0].User.id+"solana", updatedSolBalance.toString());
                await client.set(userAccountAndBalance[0].User.id+"token", updatedTokenBalance.toString());
            }
        });
        return;
    } catch(err) {
        console.log("Database error ", err);
    }
}
