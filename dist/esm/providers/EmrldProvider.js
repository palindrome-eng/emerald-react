var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { EmeraldCommunity, CollectionPolicy } from "@2112-labs/emerald.js";
import { Transaction } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import useTokenMetadata from "../hooks/useTokenMetadata";
import { Metaplex } from "@metaplex-foundation/js";
import parseBignum from "../utils/parseBignum";
var defaultState = {
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
};
var EmrldContext = createContext(defaultState);
export default function EmrldProvider(_a) {
    var _this = this;
    var _b;
    var children = _a.children, communityId = _a.communityId;
    var connection = useConnection().connection;
    var _c = useWallet(), publicKey = _c.publicKey, signTransaction = _c.signTransaction, signAllTransactions = _c.signAllTransactions;
    var signAndSend = useCallback(function (ix) { return __awaiter(_this, void 0, void 0, function () {
        var transaction, _a, blockhash, lastValidBlockHeight, signed, sent;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!signTransaction || !publicKey || !connection) {
                        throw "Wallet connection error! Refresh, reconnect your wallet and try again.";
                    }
                    transaction = new Transaction();
                    ix.forEach(function (ix) {
                        transaction.add(ix);
                    });
                    return [4 /*yield*/, connection.getLatestBlockhash()];
                case 1:
                    _a = _b.sent(), blockhash = _a.blockhash, lastValidBlockHeight = _a.lastValidBlockHeight;
                    transaction.lastValidBlockHeight = lastValidBlockHeight;
                    transaction.recentBlockhash = blockhash;
                    transaction.feePayer = publicKey;
                    return [4 /*yield*/, signTransaction(transaction)];
                case 2:
                    signed = _b.sent();
                    return [4 /*yield*/, connection.sendRawTransaction(signed.serialize())];
                case 3:
                    sent = _b.sent();
                    return [4 /*yield*/, connection.confirmTransaction({
                            blockhash: blockhash,
                            lastValidBlockHeight: lastValidBlockHeight,
                            signature: sent
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [connection, publicKey, signTransaction]);
    var signAndSendMultiple = useCallback(function (tx, type) { return __awaiter(_this, void 0, void 0, function () {
        var failed, batches, i, filteredBatches, _i, filteredBatches_1, batch, failedTransactions_1, failedTransactions, _a, lastValidBlockHeight, blockhash, transactionsWithDetails, signed, sent, filteredSent;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!signAllTransactions ||
                        !publicKey)
                        throw "Wallet error. Refresh, reconnect wallet and try again.";
                    if (!(type === "ledger")) return [3 /*break*/, 5];
                    failed = 0;
                    batches = [];
                    for (i = 0; i < tx.length; i++) {
                        batches.push(tx.slice(i * 10, (i * 10) + 10));
                    }
                    filteredBatches = batches.filter(function (b) { return b.length; });
                    _i = 0, filteredBatches_1 = filteredBatches;
                    _b.label = 1;
                case 1:
                    if (!(_i < filteredBatches_1.length)) return [3 /*break*/, 4];
                    batch = filteredBatches_1[_i];
                    return [4 /*yield*/, signAndSendMultiple(batch, undefined)];
                case 2:
                    failedTransactions_1 = (_b.sent()).failedTransactions;
                    failed = failed + failedTransactions_1;
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, {
                        failedTransactions: failed
                    }];
                case 5:
                    failedTransactions = 0;
                    return [4 /*yield*/, connection.getLatestBlockhash()];
                case 6:
                    _a = _b.sent(), lastValidBlockHeight = _a.lastValidBlockHeight, blockhash = _a.blockhash;
                    transactionsWithDetails = tx.map(function (tx) {
                        tx.lastValidBlockHeight = lastValidBlockHeight;
                        tx.feePayer = publicKey;
                        tx.recentBlockhash = blockhash;
                        return tx;
                    });
                    return [4 /*yield*/, signAllTransactions(transactionsWithDetails)];
                case 7:
                    signed = _b.sent();
                    return [4 /*yield*/, Promise.all(signed.map(function (signed) { return __awaiter(_this, void 0, void 0, function () {
                            var signature, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 })];
                                    case 1:
                                        signature = _a.sent();
                                        return [2 /*return*/, signature];
                                    case 2:
                                        err_1 = _a.sent();
                                        failedTransactions++;
                                        return [2 /*return*/, null];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 8:
                    sent = _b.sent();
                    filteredSent = sent.filter(function (sent) { return !!sent; });
                    return [4 /*yield*/, Promise.all(filteredSent.map(function (signature) { return __awaiter(_this, void 0, void 0, function () {
                            var err_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, connection.confirmTransaction({
                                                blockhash: blockhash,
                                                lastValidBlockHeight: lastValidBlockHeight,
                                                signature: signature
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        err_2 = _a.sent();
                                        failedTransactions++;
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 9:
                    _b.sent();
                    return [2 /*return*/, {
                            failedTransactions: failedTransactions
                        }];
            }
        });
    }); }, [connection, publicKey, signAllTransactions]);
    var emeraldCommunity = useMemo(function () {
        // We have to ignore the `null` value of publicKey.
        // The hook won't be called if wallet is not connected anyway.
        // @ts-ignore
        return new EmeraldCommunity(connection, communityId, publicKey);
    }, [communityId, connection, publicKey]);
    var _d = useState([]), userStakedNfts = _d[0], setUserStakedNfts = _d[1];
    var refetchUserStakedNfts = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.getUserStakedNfts()];
                case 1:
                    data = _a.sent();
                    console.log({ data: data });
                    setUserStakedNfts(data);
                    return [2 /*return*/, data];
            }
        });
    }); }, [emeraldCommunity]);
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("getUserStakedNfts");
                        return [4 /*yield*/, refetchUserStakedNfts()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [refetchUserStakedNfts]);
    var _e = useState(null), rewards = _e[0], setRewards = _e[1];
    var refetchRewards = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var rewards, sum;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(userStakedNfts.map(function (_a) {
                        var mint = _a.mint, data = _a.data;
                        return __awaiter(_this, void 0, void 0, function () {
                            var policy, claimedTime, policyData, epoch, rate, stakedFor, accrued;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        policy = data.policy, claimedTime = data.claimedTime;
                                        return [4 /*yield*/, CollectionPolicy.fromAccountAddress(connection, policy)];
                                    case 1:
                                        policyData = _b.sent();
                                        epoch = policyData.epoch, rate = policyData.rate;
                                        stakedFor = (Date.now() - (parseBignum(claimedTime) * 1000)) / (parseBignum(epoch) * 1000);
                                        accrued = stakedFor * parseBignum(rate);
                                        return [2 /*return*/, accrued];
                                }
                            });
                        });
                    }))];
                case 1:
                    rewards = _a.sent();
                    sum = rewards.length ? rewards.reduce(function (previousValue, currentValue) {
                        return previousValue + currentValue;
                    }) : 0;
                    setRewards(Math.floor(sum * 100) / 100);
                    return [2 /*return*/];
            }
        });
    }); }, [connection, userStakedNfts]);
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refetchRewards()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [refetchRewards]);
    var _f = useState([]), userStakableUnstakedNfts = _f[0], setStakableUnstakedNfts = _f[1];
    var refetchUserStakableUnstakedNfts = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var walletNfts, validCollections, mappedValidCollections, validNfts, mappedValidNfts, allStakedMapped, validUnstakedNfts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.getWalletNfts()];
                case 1:
                    walletNfts = _a.sent();
                    return [4 /*yield*/, emeraldCommunity.getCollections()];
                case 2:
                    validCollections = _a.sent();
                    mappedValidCollections = validCollections.map(function (c) {
                        return c.masterCollectionKey.toString();
                    });
                    validNfts = walletNfts.filter(function (nft) {
                        var isInCollection = !!nft.collection;
                        var isCollectionVerified = isInCollection ? nft.collection.verified : false;
                        if (!isInCollection || !isCollectionVerified)
                            return false;
                        return mappedValidCollections.includes(nft.collection.address.toString());
                    });
                    mappedValidNfts = validNfts.map(function (nft) {
                        if ('mintAddress' in nft) {
                            return nft.mintAddress;
                        }
                        else {
                            return nft.address;
                        }
                    });
                    allStakedMapped = userStakedNfts.map(function (nft) { return nft.mint.toString(); });
                    validUnstakedNfts = mappedValidNfts.filter(function (nft) {
                        return !allStakedMapped.includes(nft.toString());
                    });
                    setStakableUnstakedNfts(validUnstakedNfts);
                    return [2 /*return*/, mappedValidNfts];
            }
        });
    }); }, [emeraldCommunity, userStakedNfts]);
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refetchUserStakableUnstakedNfts()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [refetchUserStakableUnstakedNfts]);
    var getStakeTimestamp = useCallback(function (token) {
        var isStaked = userStakedNfts
            .map(function (n) { return n.mint.toString(); })
            .includes(token.toString());
        if (!isStaked)
            return null;
        var data = userStakedNfts.find(function (_a) {
            var mint = _a.mint;
            return mint.equals(token);
        });
        if (!data)
            return null;
        var stakeTime = data.data.stakeTime;
        var parsedStakeTime = typeof stakeTime === "number" ? stakeTime : stakeTime.toNumber();
        return (new Date(parsedStakeTime)).toLocaleDateString();
    }, [userStakedNfts]);
    var initializeUserGlobalAccount = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var ix;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.initializeUserGlobalAccount()];
                case 1:
                    ix = _a.sent();
                    return [2 /*return*/, ix];
            }
        });
    }); }, [emeraldCommunity]);
    var initializeUserCommunityAccount = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var ix;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.initializeUserCommunityAccount()];
                case 1:
                    ix = _a.sent();
                    return [2 /*return*/, ix];
            }
        });
    }); }, [emeraldCommunity]);
    var initializeUserRewardVault = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var ix;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.initializeUserRewardVault()];
                case 1:
                    ix = _a.sent();
                    return [2 /*return*/, ix];
            }
        });
    }); }, [emeraldCommunity]);
    var _g = useState(), userGlobalAccount = _g[0], setUserGlobalAccount = _g[1];
    var refetchUserGlobalAccount = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.getUserGlobalAccount()];
                case 1:
                    data = _a.sent();
                    setUserGlobalAccount(data);
                    return [2 /*return*/];
            }
        });
    }); }, [emeraldCommunity]);
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refetchUserGlobalAccount()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [refetchUserGlobalAccount]);
    // TODO: Finish
    var _h = useState(), userCommunityAccount = _h[0], setUserCommunityAccount = _h[1];
    var refetchUserCommunityAccount = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.getUserCommunityAccount()];
                case 1:
                    data = _a.sent();
                    setUserCommunityAccount(data);
                    return [2 /*return*/];
            }
        });
    }); }, [emeraldCommunity]);
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refetchUserCommunityAccount()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [refetchUserCommunityAccount]);
    var _j = useState(), userRewardVault = _j[0], setUserRewardVault = _j[1];
    var refetchUserRewardVault = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var communityData, coinMint, ata, account, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.getCommunity()];
                case 1:
                    communityData = _a.sent();
                    coinMint = communityData.coinMint;
                    ata = getAssociatedTokenAddressSync(coinMint, 
                    // @ts-ignore
                    publicKey, false);
                    account = null;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, getAccount(connection, ata)];
                case 3:
                    account = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_3 = _a.sent();
                    account = null;
                    return [3 /*break*/, 5];
                case 5:
                    setUserRewardVault(account || null);
                    return [2 /*return*/];
            }
        });
    }); }, [connection, emeraldCommunity, publicKey]);
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refetchUserRewardVault()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [refetchUserRewardVault]);
    var initialAccountFetchDone = useMemo(function () {
        return userRewardVault !== undefined
            && userGlobalAccount !== undefined
            && userCommunityAccount !== undefined;
    }, [userCommunityAccount, userGlobalAccount, userRewardVault]);
    var refreshState = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, refetchUserGlobalAccount()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, refetchUserCommunityAccount()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, refetchUserRewardVault()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, refetchUserStakedNfts()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, refetchUserStakableUnstakedNfts()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, refetchRewards()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(function () { return resolve(null); }, 5000); })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, refetchUserGlobalAccount()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, refetchUserCommunityAccount()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, refetchUserRewardVault()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, refetchUserStakedNfts()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, refetchUserStakableUnstakedNfts()];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, refetchRewards()];
                case 13:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [refetchRewards, refetchUserCommunityAccount, refetchUserGlobalAccount, refetchUserRewardVault, refetchUserStakableUnstakedNfts, refetchUserStakedNfts]);
    var _k = useState(null), communityData = _k[0], setCommunityData = _k[1];
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var cd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, emeraldCommunity.getCommunity()];
                    case 1:
                        cd = _a.sent();
                        setCommunityData(cd);
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [emeraldCommunity]);
    var metaplex = useMemo(function () {
        return new Metaplex(connection);
    }, [connection]);
    var rewardTokenMetadata = useTokenMetadata(((_b = communityData === null || communityData === void 0 ? void 0 : communityData.coinMint) === null || _b === void 0 ? void 0 : _b.toString()) || null, metaplex).metadata;
    var _l = useState(null), dailyEstimatedReward = _l[0], setDailyEstimatedReward = _l[1];
    var refetchDailyEstimatedReward = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var rewards, sum;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(userStakedNfts.map(function (_a) {
                        var mint = _a.mint, data = _a.data;
                        return __awaiter(_this, void 0, void 0, function () {
                            var policy, policyData, epoch, rate, epochsInDay, rewardsInDay;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        policy = data.policy;
                                        return [4 /*yield*/, CollectionPolicy.fromAccountAddress(connection, policy)];
                                    case 1:
                                        policyData = _b.sent();
                                        epoch = policyData.epoch, rate = policyData.rate;
                                        epochsInDay = (24 * 60 * 60 * 1000) / (parseBignum(epoch) * 1000);
                                        rewardsInDay = parseBignum(rate) * epochsInDay;
                                        return [2 /*return*/, rewardsInDay];
                                }
                            });
                        });
                    }))];
                case 1:
                    rewards = _a.sent();
                    sum = rewards.length
                        ? rewards.reduce(function (previousValue, currentValue) { return previousValue + currentValue; })
                        : null;
                    setDailyEstimatedReward(sum);
                    return [2 /*return*/];
            }
        });
    }); }, [connection, userStakedNfts]);
    useEffect(function () {
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, refetchDailyEstimatedReward()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, [refetchDailyEstimatedReward]);
    var stakeOne = useCallback(function (_a) {
        var nft = _a.nft, policy = _a.policy;
        return __awaiter(_this, void 0, void 0, function () {
            var canBeStaked, ix;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        canBeStaked = userStakableUnstakedNfts
                            .map(function (n) { return n.toString(); })
                            .includes(nft.toString());
                        if (!canBeStaked)
                            throw "Cannot be staked.";
                        return [4 /*yield*/, emeraldCommunity.stakeNft(nft, policy)];
                    case 1:
                        ix = _b.sent();
                        return [4 /*yield*/, signAndSend([ix])];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, refreshState()];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    }, [emeraldCommunity, refreshState, signAndSend, userStakableUnstakedNfts]);
    var unstakeOne = useCallback(function (_a) {
        var nft = _a.nft, policy = _a.policy;
        return __awaiter(_this, void 0, void 0, function () {
            var canBeUnstaked, ix;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        canBeUnstaked = userStakedNfts
                            .map(function (n) { return n.mint.toString(); })
                            .includes(nft.toString());
                        if (!canBeUnstaked)
                            throw "Can't be unstaked";
                        return [4 /*yield*/, emeraldCommunity.unstakeNft(nft, policy)];
                    case 1:
                        ix = _b.sent();
                        return [4 /*yield*/, signAndSend([ix])];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, refreshState()];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    }, [emeraldCommunity, signAndSend, userStakedNfts]);
    var stakeAll = useCallback(function (type) { return __awaiter(_this, void 0, void 0, function () {
        var allStakable, instructions, transactions;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, refetchUserStakableUnstakedNfts()];
                case 1:
                    allStakable = _a.sent();
                    return [4 /*yield*/, Promise.all(allStakable.map(function (n) { return __awaiter(_this, void 0, void 0, function () {
                            var ix;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, emeraldCommunity.stakeNft(n)];
                                    case 1:
                                        ix = _a.sent();
                                        return [2 /*return*/, ix];
                                }
                            });
                        }); }))];
                case 2:
                    instructions = _a.sent();
                    transactions = instructions.map(function (ix) {
                        var tx = new Transaction();
                        tx.add(ix);
                        return tx;
                    });
                    return [4 /*yield*/, signAndSendMultiple(transactions, type)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, refreshState()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [emeraldCommunity, refetchUserStakableUnstakedNfts, refreshState, signAndSendMultiple]);
    var unstakeAll = useCallback(function (type) { return __awaiter(_this, void 0, void 0, function () {
        var allStaked, instructions, transactions;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, refetchUserStakedNfts()];
                case 1:
                    allStaked = _a.sent();
                    return [4 /*yield*/, Promise.all(allStaked.map(function (n) { return __awaiter(_this, void 0, void 0, function () {
                            var ix;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, emeraldCommunity.unstakeNft(n.mint)];
                                    case 1:
                                        ix = _a.sent();
                                        return [2 /*return*/, ix];
                                }
                            });
                        }); }))];
                case 2:
                    instructions = _a.sent();
                    transactions = instructions.map(function (ix) {
                        var tx = new Transaction();
                        tx.add(ix);
                        return tx;
                    });
                    return [4 /*yield*/, signAndSendMultiple(transactions, type)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, refreshState()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [emeraldCommunity, refetchUserStakedNfts, refreshState, signAndSendMultiple]);
    var claimRewards = useCallback(function (type) { return __awaiter(_this, void 0, void 0, function () {
        var ix, transactions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, emeraldCommunity.claimAllRewards()];
                case 1:
                    ix = _a.sent();
                    transactions = ix.map(function (ix) {
                        var tx = new Transaction();
                        tx.add(ix);
                        return tx;
                    });
                    return [4 /*yield*/, signAndSendMultiple(transactions, type)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, refreshState()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [emeraldCommunity, refreshState, signAndSendMultiple]);
    return (_jsx(EmrldContext.Provider, __assign({ value: {
            unstakeOne: unstakeOne,
            unstakeAll: unstakeAll,
            stakeOne: stakeOne,
            stakeAll: stakeAll,
            userRewardVault: userRewardVault,
            userGlobalAccount: userGlobalAccount,
            userCommunityAccount: userCommunityAccount,
            community: emeraldCommunity,
            rewards: rewards,
            getStakeTimestamp: getStakeTimestamp,
            initialAccountFetchDone: initialAccountFetchDone,
            userStakableUnstakedNfts: userStakableUnstakedNfts,
            userStakedNfts: userStakedNfts,
            claimRewards: claimRewards,
            refreshState: refreshState,
            communityData: communityData,
            rewardTokenMetadata: rewardTokenMetadata,
            dailyEstimatedReward: dailyEstimatedReward,
            signAndSend: signAndSend,
            initializeUserGlobalAccount: initializeUserGlobalAccount,
            initializeUserCommunityAccount: initializeUserCommunityAccount,
            initializeUserRewardVault: initializeUserRewardVault
        } }, { children: children })));
}
var useEmrld = function () {
    return useContext(EmrldContext);
};
export { useEmrld };
