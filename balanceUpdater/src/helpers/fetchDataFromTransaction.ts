import { clusterApiUrl, Connection, ParsedInstruction } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl('devnet'));

export const extractData = async (signature: string) => {
    const transaction = await connection.getParsedTransaction(signature);
    const parsedData = transaction?.transaction.message.instructions[2] as ParsedInstruction;
    console.log(parsedData.parsed);
}
