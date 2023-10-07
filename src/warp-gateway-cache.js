"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStateRedWarp = exports.getTokenBalanceWarp = exports.getContractExecutedWarp = void 0;
const warp_contracts_1 = require("warp-contracts");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const warp_contracts_plugin_vm2_1 = require("warp-contracts-plugin-vm2");
const warp_contracts_sqlite_1 = require("warp-contracts-sqlite");
const mapStatus = new Map();
const volumeDir = './fileCache';
if (!fs_1.default.existsSync(volumeDir)) {
    fs_1.default.mkdirSync(volumeDir);
}
const contractIds = [
    // $u
    'KTzTXT_ANmF84fWEKHzWURD1LWd9QaFR9yfYUwH2Lxw',
    // stamp
    'TlqASNDLA1Uh8yFiH-BzR_1FDag4s735F3PoUFEv2Mo'
];
const evaluationOptions = {
    "maxCallDepth": 666,
    "maxInteractionEvaluationTimeSeconds": 20000,
    "allowBigInt": true,
    "unsafeClient": "skip",
    "internalWrites": true,
    "cacheEveryNInteractions": 2000,
    "whitelistSources": [
        "Of9pi--Gj7hCTawhgxOwbuWnFI1h24TTgO5pw8ENJNQ",
        "W78KEzU8vIODFHzwa9ab7SS7Pjchc7KenivCiwSHxBY",
        "kP1Ed8AMvaaBrEFjatP4pSmiE_fsRrGS0EcBMQYYiyc",
        "mGxosQexdvrvzYCshzBvj18Xh1QmZX16qFJBuh4qobo",
        "7qv5x9A0NgAlTdMnBc1H2HFvN-te0kzzuT9RNt_66g8",
        "eIAyBgHH-H7Qzw9fj7Austj30QKPQn27eaakvpOUSR8",
        "Of9pi--Gj7hCTawhgxOwbuWnFI1h24TTgO5pw8ENJNQ",
        "ovWCp0xKuHtq-bADXbtiNr6umwb_AE73kVZWtfHlX3w",
        "1hDZBRSptTNgnACuO9qGHLbaOfnAcMBKCHcHPRhMWUY",
        "LBcYEl2zwKDApj1Cow1_BYyiicxVV7OCZTexsjk6mB4",
        "dRTFmLwJ3cNqdNvFK4yUvwc13CrJtFOmLymLxL4HWOE",
        "yXPm9-9VyxH9otGf7xim0EJsnt21IJN8qJjanFTC_kc",
        "qOd7mNAJdju9PxtsRJbel4Zu3xYgEwUbxW8U14czjD8",
        "0GOnb0o9c232d6SXF_HXHbGzfIdiYeos7U5jobOSZ_c",
        "8kPgNMm7dZUVk93T7wq05otEy1oDNqZhyD3L7WrcMTY",
        "yDAppVePqGU1qcRnxdk-AShpIJ0RHCZixOMXtJTgm4Y",
        "W7V0n7g2UKhCee1QDTpvAq6eI6pP9jCS860uF70TbYY",
        "h9v17KHV4SXwdW2-JHU6a23f6R0YtbXZJJht8LfP8QM"
    ]
};
const smartweave = warp_contracts_1.WarpFactory
    .forMainnet(Object.assign(Object.assign({}, warp_contracts_1.defaultCacheOptions), { dbLocation: path_1.default.join(volumeDir, 'warp/state') }))
    .use(new warp_contracts_plugin_vm2_1.VM2Plugin())
    .useStateCache(new warp_contracts_sqlite_1.SqliteContractCache(Object.assign(Object.assign({}, warp_contracts_1.defaultCacheOptions), { dbLocation: path_1.default.join(volumeDir, 'warp/state') }), {
    maxEntriesPerContract: 20
}));
function updateStatus(warp, contractTxId, evaluationOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contract = warp.contract(contractTxId);
            const result = yield contract.setEvaluationOptions(evaluationOptions).readState();
            const stateHash = yield contract.stateHash(result.cachedValue.state);
            // cache to memory
            mapStatus.set(contractTxId, { latestSortKey: result.sortKey, stateHash: stateHash, state: result.cachedValue.state, validity: result.cachedValue.validity });
        }
        catch (error) {
            console.log('readState from warp gateway error: error:', error, 'contractId:', contractTxId);
        }
    });
}
function updateAllAsyncRedstone() {
    console.log('start sync sw status from warp-gateway');
    return Promise.all(contractIds.map((contractId) => {
        return updateStatus(smartweave, contractId, evaluationOptions);
    }));
}
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function waitAndRun() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            yield updateAllAsyncRedstone();
            yield wait(5 * 60 * 1000); // wait for 5 minutes
        }
    });
}
waitAndRun();
// about api ---
function getContractExecutedWarp(contractId, txId) {
    if (mapStatus.has(contractId)) {
        const status = mapStatus.get(contractId);
        const val = status.validity[txId];
        if (val === undefined) {
            return false;
        }
        return val;
    }
    return false;
}
exports.getContractExecutedWarp = getContractExecutedWarp;
function getTokenBalanceWarp(contractId, address) {
    if (mapStatus.has(contractId)) {
        const status = mapStatus.get(contractId);
        const val = status.state['balances'][address];
        if (val === undefined) {
            return '0';
        }
        return '' + val;
    }
    return '0';
}
exports.getTokenBalanceWarp = getTokenBalanceWarp;
function getStateRedWarp(contractId) {
    if (mapStatus.has(contractId) == false) {
        return;
    }
    return mapStatus.get(contractId);
}
exports.getStateRedWarp = getStateRedWarp;
