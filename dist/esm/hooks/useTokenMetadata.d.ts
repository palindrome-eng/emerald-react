import { Metaplex } from "@metaplex-foundation/js";
export default function useTokenMetadata(token: string | null, metaplex: Metaplex, type?: "collection"): {
    metadata: {
        name: string;
        img: string;
        symbol: string;
    } | null;
    error: string | null;
};
