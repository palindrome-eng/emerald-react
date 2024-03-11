export default function parseBignum(num) {
    return typeof num === "number" ? num : num.toNumber();
}
