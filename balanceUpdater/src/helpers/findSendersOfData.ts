import { Connection, clusterApiUrl, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { accountPublicKey } from '../constants/constants';
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
        let lastUsedTransaction = await client.GET("transactionUsedLast");
        if(!lastUsedTransaction) {
            const lastUsedTransactionFromDB = await db.select().from(LastTransactionUsed);
            if(lastUsedTransactionFromDB.length == 0) {
                console.log("Initialize the database");
                return []
            }
            lastUsedTransaction = lastUsedTransactionFromDB[0].lastTransactionUsed;
        }
        let signatures = await connection.getSignaturesForAddress(accountPubKey, {
            until: lastUsedTransaction,
        });
        if(signatures.length == 0) {
            return [];
        }
        await client.SET("transactionUsedLast", signatures[0].signature);
        await db.update(LastTransactionUsed).set({
            lastTransactionUsed: signatures[0].signature
        });
        return signatures;
    } catch(err) {
        console.log("There was an issue with the database");
        return [];
    }
}

