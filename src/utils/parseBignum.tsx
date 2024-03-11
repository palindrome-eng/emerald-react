import {bignum} from "@metaplex-foundation/beet";

export default function parseBignum(num: bignum) {
    return typeof num === "number" ? num : num.toNumber();
}