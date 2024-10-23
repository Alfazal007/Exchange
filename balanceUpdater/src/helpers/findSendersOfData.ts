import { PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { accountPublicKey, tokenWalletAddress } from '../constants/constants';
import { client } from '../redis';
import { db } from '../db';
import { LastTransactionUsed } from '../db/schema';
import { connection } from '..';


export async function findSendersForAccount(): Promise<ConfirmedSignatureInfo[]> {
    try {
        if(!client.isOpen) {
            await client.connect();
        }
        const accountPubKey = new PublicKey(accountPublicKey);
        const tokenWallet = new PublicKey(tokenWalletAddress);
        let lastUsedTransaction = await client.GET("transactionUsedLast");
        let lastUsedTransactionToken = await client.GET("transactionUsedLastToken");
        if(!lastUsedTransaction) {
            const lastUsedTransactionFromDB = await db.select().from(LastTransactionUsed);
            if(lastUsedTransactionFromDB.length == 0) {
                console.log("Initialize the database");
                return []
            }
            lastUsedTransaction = lastUsedTransactionFromDB[0].lastTransactionUsed;
        }
        if(!lastUsedTransactionToken) {
            const lastUsedTransactionFromDB = await db.select().from(LastTransactionUsed);
            if(lastUsedTransactionFromDB.length == 0) {
                console.log("Initialize the database");
                return []
            }
            lastUsedTransactionToken = lastUsedTransactionFromDB[0].lastTransactionUsedToken;
        }

        let signatures = await connection.getSignaturesForAddress(accountPubKey, {
            until: lastUsedTransaction,
        });
        let signaturesOfToken = await connection.getSignaturesForAddress(tokenWallet, {
            until: lastUsedTransactionToken,
        });
        let appendedTransactions = [...signatures, ...signaturesOfToken];
        if(appendedTransactions.length == 0) {
            return [];
        }
        if(signatures.length > 0) {
            await client.SET("transactionUsedLast", signatures[0].signature);
            await db.update(LastTransactionUsed).set({
                lastTransactionUsed: signatures[0].signature
            });
        }
        if(signaturesOfToken.length > 0) {
            await client.SET("transactionUsedLastToken", signaturesOfToken[0].signature);
            await db.update(LastTransactionUsed).set({
                lastTransactionUsedToken: signaturesOfToken[0].signature
            });
        }
        return appendedTransactions;
    } catch(err) {
        console.log("There was an issue with the database", err);
        return [];
    }
}

