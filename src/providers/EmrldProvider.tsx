import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {
    EmeraldCommunity,
    CollectionPolicy,
    CommunityPool,
    NftTicket,
    UserAccount,
    UserCommunityAccount
} from "@2112-labs/emerald.js";
import {PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {Account, getAccount, getAssociatedTokenAddressSync} from "@solana/spl-token";
import useTokenMetadata from "../hooks/useTokenMetadata";
import {Metaplex} from "@metaplex-foundation/js";
import parseBignum from "../utils/parseBignum";

// Account of type null is fetched, but not initialized.
// Account of type undefined is not fetched yet.

// Need this type for transaction handler functions.
// We only diffrentiate `ledger` from other wallets.
type WalletType = "ledger" | undefined;

type StakedNft = {
    data: NftTicket,
    mint: PublicKey
}

// General type for arguments of Token Handler functions (stake/unstake).
type TokenHandlersArgs = {
    nft: PublicKey,
    policy?: number
}

type RewardTokenMetadata = {
    img: string,
    name: string,
    symbol: string,
}

type EmrldContextData = {
    community: EmeraldCommunity | null,
    userGlobalAccount: UserAccount | null | undefined,
    userCommunityAccount: UserCommunityAccount | null | undefined,
    userRewardVault: Account | null | undefined,
    stakeOne: ((args: TokenHandlersArgs) => Promise<void>) | null,
    unstakeOne: ((args: TokenHandlersArgs) => Promise<void>) | null,
    unstakeAll: ((type: WalletType) => Promise<void>) | null,
    stakeAll: ((type: WalletType) => Promise<void>) | null,
    claimRewards: ((type: WalletType) => Promise<void>) | null,
    rewards: number | null,
    getStakeTimestamp: ((token: PublicKey) => string | null) | null,
    initialAccountFetchDone: boolean,
    userStakedNfts: StakedNft[],
    userStakableUnstakedNfts: PublicKey[],
    refreshState: (() => Promise<void>) | null,
    communityData: CommunityPool | null,
    rewardTokenMetadata: RewardTokenMetadata | null,
    dailyEstimatedReward: number | null,
    initializeUserGlobalAccount: (() => Promise<TransactionInstruction>) | null,
    initializeUserCommunityAccount: (() => Promise<TransactionInstruction>) | null,
    initializeUserRewardVault: (() => Promise<TransactionInstruction>) | null,
    signAndSend: ((ix: TransactionInstruction[]) => Promise<void>) | null
}

const defaultState: EmrldContextData = {
    community: null,
    userCommunityAccount: undefined,
    userGlobalAccount: undefined,
    userRewardVault: undefined,
    stakeAll: null,
    stakeOne: null,
    unstakeAll: null,
    unstakeOne: null,
    getStakeTimestamp: null,
    rewards: null,
    initialAccountFetchDone: false,
    userStakedNfts: [],
    userStakableUnstakedNfts: [],
    claimRewards: null,
    refreshState: null,
    communityData: null,
    rewardTokenMetadata: null,
    dailyEstimatedReward: null,
    initializeUserGlobalAccount: null,
    initializeUserCommunityAccount: null,
    initializeUserRewardVault: null,
    signAndSend: null,
}

const EmrldContext = createContext<EmrldContextData>(defaultState);

export default function EmrldProvider({ children, communityId } : {
    children: JSX.Element,
    communityId: number
}) {

    const { connection } = useConnection();
    const {
        publicKey,
        signTransaction,
        signAllTransactions,
    } = useWallet();

    const signAndSend = useCallback(async (ix: TransactionInstruction[]) => {
        if (!signTransaction || !publicKey || !connection) {
            throw "Wallet connection error! Refresh, reconnect your wallet and try again.";
        }

        const transaction = new Transaction();
        ix.forEach(ix => {
            transaction.add(ix);
        });

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signed = await signTransaction(transaction);
        const sent = await connection.sendRawTransaction(
            signed.serialize()
        );

        await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature: sent
        });
    }, [connection, publicKey, signTransaction]);

    const signAndSendMultiple = useCallback(async (tx: Transaction[], type: WalletType) => {
        if (
            !signAllTransactions ||
            !publicKey
        ) throw "Wallet error. Refresh, reconnect wallet and try again.";

        if (type === "ledger") {
            let failed = 0;

            // Separate transactions into batches of 10.
            const batches: (Transaction)[][] = [];
            for (let i = 0; i < tx.length; i++) {
                batches.push(tx.slice(
                    i * 10,
                    (i * 10) + 10
                ));
            }

            // Remove empty batches.
            const filteredBatches = batches.filter(b => b.length);

            for (let batch of filteredBatches) {
                const { failedTransactions } = await signAndSendMultiple(batch, undefined);
                failed = failed + failedTransactions;
            }

            return {
                failedTransactions: failed
            }
        }

        let failedTransactions = 0;

        const {
            lastValidBlockHeight,
            blockhash
        } = await connection.getLatestBlockhash();

        const transactionsWithDetails = tx.map(tx => {
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.feePayer = publicKey;
            tx.recentBlockhash = blockhash

            return tx;
        });

        const signed = await signAllTransactions(transactionsWithDetails);
        const sent = await Promise.all(signed.map(async (signed) => {
            try {
                const signature = await connection.sendRawTransaction(
                    signed.serialize(),
                    { maxRetries: 3 }
                );

                return signature;
            } catch (err) {
                failedTransactions++;
                return null;
            }
        }));

        const filteredSent = sent.filter(sent => !!sent) as string[];
        await Promise.all(filteredSent.map(async (signature) => {
            try {
                await connection.confirmTransaction({
                    blockhash,
                    lastValidBlockHeight,
                    signature
                });
            } catch (err) {
                failedTransactions++;
            }
        }));

        return {
            failedTransactions
        }
    }, [connection, publicKey, signAllTransactions]);

    const emeraldCommunity = useMemo(() => {
        // We have to ignore the `null` value of publicKey.
        // The hook won't be called if wallet is not connected anyway.
        // @ts-ignore
        return new EmeraldCommunity(connection, communityId, publicKey);
    }, [communityId, connection, publicKey]);

    const [userStakedNfts, setUserStakedNfts] = useState<StakedNft[]>([]);
    const refetchUserStakedNfts = useCallback(async () => {
        const data = await emeraldCommunity.getUserStakedNfts();
        console.log({data});
        setUserStakedNfts(data);
        return data;
    }, [emeraldCommunity]);

    useEffect(() => {
        (async () => {
            console.log("getUserStakedNfts");
            await refetchUserStakedNfts();
        })();
    }, [refetchUserStakedNfts]);

    const [rewards, setRewards] = useState<number | null>(null);
    const refetchRewards = useCallback(async () => {
        const rewards = await Promise.all(userStakedNfts.map(async ({ mint, data }) => {
            const {policy, claimedTime} = data;
            const policyData = await CollectionPolicy.fromAccountAddress(connection, policy);
            const { epoch, rate } = policyData;

            // Unit: epochs.
            const stakedFor = (Date.now() - (parseBignum(claimedTime) * 1000)) / (parseBignum(epoch) * 1000);
            const accrued = stakedFor * parseBignum(rate);

            return accrued;
        }));

        const sum = rewards.length ? rewards.reduce((previousValue, currentValue) => {
            return previousValue + currentValue;
        }) : 0;

        setRewards(
            Math.floor(sum * 100) / 100
        );
    }, [connection, userStakedNfts]);

    useEffect(() => {
        (async () => {
            await refetchRewards();
        })();
    }, [refetchRewards]);

    const [userStakableUnstakedNfts, setStakableUnstakedNfts] = useState<PublicKey[]>([]);
    const refetchUserStakableUnstakedNfts = useCallback(async () => {
        const walletNfts = await emeraldCommunity.getWalletNfts();
        const validCollections = await emeraldCommunity.getCollections();

        const mappedValidCollections = validCollections.map(c => {
            return c.masterCollectionKey.toString();
        });

        const validNfts = walletNfts.filter(nft => {
            const isInCollection = !!nft.collection;
            const isCollectionVerified = isInCollection ? nft.collection.verified : false;

            if (!isInCollection || !isCollectionVerified) return false;
            return mappedValidCollections.includes(nft.collection.address.toString());
        });

        const mappedValidNfts = validNfts.map(nft => {
            if ('mintAddress' in nft) {
                return nft.mintAddress;
            } else {
                return nft.address;
            }
        });

        const allStakedMapped = userStakedNfts.map(nft => nft.mint.toString());
        const validUnstakedNfts = mappedValidNfts.filter(nft => {
            return !allStakedMapped.includes(nft.toString());
        });

        setStakableUnstakedNfts(validUnstakedNfts);
        return mappedValidNfts;
    }, [emeraldCommunity, userStakedNfts]);

    useEffect(() => {
        (async () => {
            await refetchUserStakableUnstakedNfts();
        })();
    }, [refetchUserStakableUnstakedNfts]);

    const getStakeTimestamp = useCallback((token: PublicKey) => {
        const isStaked = userStakedNfts
            .map(n => n.mint.toString())
            .includes(token.toString());

        if (!isStaked) return null;

        const data = userStakedNfts.find(({mint}) => {
            return mint.equals(token);
        });

        if (!data) return null;
        const { stakeTime } = data.data;

        const parsedStakeTime = typeof stakeTime === "number" ? stakeTime : stakeTime.toNumber();
        return (new Date(parsedStakeTime)).toLocaleDateString();
    }, [userStakedNfts]);

    const initializeUserGlobalAccount = useCallback(async () => {
        const ix = await emeraldCommunity.initializeUserGlobalAccount();
        return ix;
    }, [emeraldCommunity]);

    const initializeUserCommunityAccount = useCallback(async () => {
        const ix = await emeraldCommunity.initializeUserCommunityAccount();
        return ix;
    }, [emeraldCommunity]);

    const initializeUserRewardVault = useCallback(async () => {
        const ix = await emeraldCommunity.initializeUserRewardVault();
        return ix;
    }, [emeraldCommunity]);

    const [userGlobalAccount, setUserGlobalAccount] = useState<UserAccount | null | undefined>();
    const refetchUserGlobalAccount = useCallback(async () => {
        const data = await emeraldCommunity.getUserGlobalAccount();
        setUserGlobalAccount(data);
    }, [emeraldCommunity]);

    useEffect(() => {
        (async () => {
            await refetchUserGlobalAccount();
        })();
    }, [refetchUserGlobalAccount]);

    // TODO: Finish
    const [userCommunityAccount, setUserCommunityAccount] = useState<UserCommunityAccount | null | undefined>();
    const refetchUserCommunityAccount = useCallback(async () => {
        const data = await emeraldCommunity.getUserCommunityAccount();
        setUserCommunityAccount(data);
    }, [emeraldCommunity]);

    useEffect(() => {
        (async () => {
            await refetchUserCommunityAccount();
        })();
    }, [refetchUserCommunityAccount]);

    const [userRewardVault, setUserRewardVault] = useState<Account | null | undefined>();
    const refetchUserRewardVault = useCallback(async () => {
        const communityData = await emeraldCommunity.getCommunity();
        const { coinMint } = communityData;

        const ata = getAssociatedTokenAddressSync(
            coinMint,
            // @ts-ignore
            publicKey,
            false
        );

        let account: Account | null = null
        try {
            account = await getAccount(connection, ata);
        } catch (err) {
            account = null;
        }

        setUserRewardVault(account || null);
    }, [connection, emeraldCommunity, publicKey]);

    useEffect(() => {
        (async () => {
            await refetchUserRewardVault();
        })();
    }, [refetchUserRewardVault]);

    const initialAccountFetchDone = useMemo(() => {
        return userRewardVault !== undefined
            && userGlobalAccount !== undefined
            && userCommunityAccount !== undefined;
    }, [userCommunityAccount, userGlobalAccount, userRewardVault]);

    const refreshState = useCallback(async () => {
        await refetchUserGlobalAccount();
        await refetchUserCommunityAccount();
        await refetchUserRewardVault();
        await refetchUserStakedNfts();
        await refetchUserStakableUnstakedNfts();
        await refetchRewards();

        await new Promise((resolve) => setTimeout(() => resolve(null), 5000));
        await refetchUserGlobalAccount();
        await refetchUserCommunityAccount();
        await refetchUserRewardVault();
        await refetchUserStakedNfts();
        await refetchUserStakableUnstakedNfts();
        await refetchRewards();
    }, [refetchRewards, refetchUserCommunityAccount, refetchUserGlobalAccount, refetchUserRewardVault, refetchUserStakableUnstakedNfts, refetchUserStakedNfts]);

    const [communityData, setCommunityData] = useState<CommunityPool | null>(null);
    useEffect(() => {
        (async () => {
            const cd = await emeraldCommunity.getCommunity();
            setCommunityData(cd);
        })();
    }, [emeraldCommunity]);

    const metaplex = useMemo(() => {
        return new Metaplex(connection)
    }, [connection]);

    const { metadata: rewardTokenMetadata } = useTokenMetadata(
        communityData?.coinMint?.toString() || null,
        metaplex
    );

    const [dailyEstimatedReward, setDailyEstimatedReward] = useState<number | null>(null);
    const refetchDailyEstimatedReward = useCallback(async () => {
        const rewards = await Promise.all(userStakedNfts.map(async ({ mint, data }) => {
            const {policy} = data;
            const policyData = await CollectionPolicy.fromAccountAddress(connection, policy);
            const { epoch, rate } = policyData;

            const epochsInDay = (24 * 60 * 60 * 1000) / (parseBignum(epoch) * 1000);
            const rewardsInDay = parseBignum(rate) * epochsInDay;

            return rewardsInDay;
        }));

        const sum = rewards.length
            ? rewards.reduce((previousValue, currentValue) => previousValue + currentValue)
            : null;

        setDailyEstimatedReward(sum);
    }, [connection, userStakedNfts]);

    useEffect(() => {
        (async () => {
            await refetchDailyEstimatedReward();
        })();
    }, [refetchDailyEstimatedReward]);

    const stakeOne = useCallback(async ({ nft, policy } : TokenHandlersArgs) => {
        const canBeStaked = userStakableUnstakedNfts
            .map(n => n.toString())
            .includes(nft.toString());

        if (!canBeStaked) throw "Cannot be staked.";

        const ix = await emeraldCommunity.stakeNft(nft, policy);
        await signAndSend([ix]);
        await refreshState();
    }, [emeraldCommunity, refreshState, signAndSend, userStakableUnstakedNfts]);

    const unstakeOne = useCallback(async ({ nft, policy } : TokenHandlersArgs) => {
        const canBeUnstaked = userStakedNfts
            .map(n => n.mint.toString())
            .includes(nft.toString());

        if (!canBeUnstaked) throw "Can't be unstaked";

        const ix = await emeraldCommunity.unstakeNft(nft, policy);
        await signAndSend([ix]);
        await refreshState();
    }, [emeraldCommunity, signAndSend, userStakedNfts]);

    const stakeAll = useCallback(async (type: WalletType) => {
        const allStakable = await refetchUserStakableUnstakedNfts();
        const instructions = await Promise.all(allStakable.map(async (n) => {
            const ix = await emeraldCommunity.stakeNft(n);
            return ix;
        }));

        const transactions = instructions.map(ix => {
            const tx = new Transaction();
            tx.add(ix);
            return tx;
        });

        await signAndSendMultiple(transactions, type);
        await refreshState();
    }, [emeraldCommunity, refetchUserStakableUnstakedNfts, refreshState, signAndSendMultiple]);

    const unstakeAll = useCallback(async (type: WalletType) => {
        const allStaked = await refetchUserStakedNfts();

        const instructions = await Promise.all(allStaked.map(async (n) => {
            const ix = await emeraldCommunity.unstakeNft(n.mint);
            return ix;
        }));

        const transactions = instructions.map(ix => {
            const tx = new Transaction();
            tx.add(ix);
            return tx;
        });

        await signAndSendMultiple(transactions, type);
        await refreshState();
    }, [emeraldCommunity, refetchUserStakedNfts, refreshState, signAndSendMultiple]);

    const claimRewards = useCallback(async (type: WalletType) => {
        const ix = await emeraldCommunity.claimAllRewards();
        const transactions = ix.map(ix => {
            const tx = new Transaction();
            tx.add(ix);
            return tx;
        });

        await signAndSendMultiple(transactions, type);
        await refreshState();
    }, [emeraldCommunity, refreshState, signAndSendMultiple]);

    return (
        <EmrldContext.Provider value={{
            unstakeOne,
            unstakeAll,
            stakeOne,
            stakeAll,
            userRewardVault,
            userGlobalAccount,
            userCommunityAccount,
            community: emeraldCommunity,
            rewards,
            getStakeTimestamp,
            initialAccountFetchDone,
            userStakableUnstakedNfts,
            userStakedNfts,
            claimRewards,
            refreshState,
            communityData,
            rewardTokenMetadata,
            dailyEstimatedReward,
            signAndSend,
            initializeUserGlobalAccount,
            initializeUserCommunityAccount,
            initializeUserRewardVault
        }}>
            { children }
        </EmrldContext.Provider>
    );
}

const useEmrld = () => {
    return useContext(EmrldContext);
}

export { useEmrld }
export type { EmrldContextData }