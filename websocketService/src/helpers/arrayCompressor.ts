import { Ask, Bid } from "../types/interfaces";

function arrayCompressor(arr: Ask[] | Bid[]): { price: string, quantity: string }[] {
    let latestArr: { price: string, quantity: string }[] = [];
    let index = 0;
    while (index < arr.length) {
        let curArrItem = arr[index];
        index++;
        let curQuantity = BigInt(curArrItem.quantity);
        while (index < arr.length && curArrItem.price == arr[index].price) {
            curQuantity += BigInt(arr[index].quantity);
            index++;
        }
        latestArr.push({ price: curArrItem.price, quantity: curQuantity.toString() });
        if (latestArr.length >= 20) {
            return latestArr;
        }
    }
    return latestArr;
}

export {
    arrayCompressor
}
