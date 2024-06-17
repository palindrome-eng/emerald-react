import React from "react";
import { CommunityPool, EmeraldCommunity, NftTicket, UserAccount, UserCommunityAccount } from "@2112-labs/emerald.js";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Account } from "@solana/spl-token";
declare type WalletType = "ledger" | undefined;
declare type StakedNft = {
    data: NftTicket;
    mint: PublicKey;
};
declare type TokenHandlersArgs = {
    nft: PublicKey;
    policy?: number;
};
declare type RewardTokenMetadata = {
    img: string;
    name: string;
    symbol: string;
};
declare type EmrldContextData = {
    community: EmeraldCommunity | null;
    userGlobalAccount: UserAccount | null | undefined;
    userCommunityAccount: UserCommunityAccount | null | undefined;
    userRewardVault: Account | null | undefined;
    stakeOne: ((args: TokenHandlersArgs) => Promise<void>) | null;
    unstakeOne: ((args: TokenHandlersArgs) => Promise<void>) | null;
    unstakeAll: ((type: WalletType) => Promise<void>) | null;
    stakeAll: ((type: WalletType) => Promise<void>) | null;
    claimRewards: ((type: WalletType) => Promise<void>) | null;
    rewards: number | null;
    getStakeTimestamp: ((token: PublicKey) => string | null) | null;
    initialAccountFetchDone: boolean;
    userStakedNfts: StakedNft[];
    userStakableUnstakedNfts: PublicKey[];
    refreshState: (() => Promise<void>) | null;
    communityData: CommunityPool | null;
    rewardTokenMetadata: RewardTokenMetadata | null;
    dailyEstimatedReward: number | null;
    initializeUserGlobalAccount: (() => Promise<TransactionInstruction>) | null;
    initializeUserCommunityAccount: (() => Promise<TransactionInstruction>) | null;
    initializeUserRewardVault: (() => Promise<TransactionInstruction>) | null;
    signAndSend: ((ix: TransactionInstruction[]) => Promise<void>) | null;
};
export default function EmrldProvider({ children, communityId }: {
    children: JSX.Element;
    communityId: number;
}): React.JSX.Element;
declare const useEmrld: () => EmrldContextData;
export { useEmrld };
export type { EmrldContextData };
