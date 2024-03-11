import {Metaplex} from "@metaplex-foundation/js";
import {useEffect, useState} from "react";
import {PublicKey} from "@solana/web3.js";
import axios from "axios";

export default function useTokenMetadata(token: string | null, metaplex: Metaplex, type?: "collection") {

    const [metadata, setMetadata] = useState<{ name: string, img: string, symbol: string } | null>(null);
    const [error, setError] = useState<null | string>(null);

    useEffect(() => {
        setError(null);
    }, [token]);

    useEffect(() => {
        (async () => {
            if (token === null) {
                setMetadata(null);
                return;
            }

            try {
                const metadata = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(token) });

                let data: { name: string, img: string, symbol: string } | null = null;
                if (metadata.jsonLoaded) {
                    data = {
                        name: metadata.name,
                        // @ts-ignore
                        img: metadata.json.image || "",
                        symbol: metadata.symbol,
                    }
                } else {
                    const res = await axios.get(metadata.uri);
                    data = {
                        name: metadata.name,
                        img: res.data.image as string,
                        symbol: metadata.symbol,
                    }
                }

                setMetadata(data);
                return;
            } catch (err) {
                setMetadata(null);
                if (type === "collection") {
                    setError("Failed to find collection. Make sure your collection supports Metaplex Verified Collection Standard.");
                } else {
                    setError("Failed to find token metadata. Make sure token address is valid.");
                }
            }
        })();
    }, [metaplex, token, type]);

    return {
        metadata,
        error,
    }
}