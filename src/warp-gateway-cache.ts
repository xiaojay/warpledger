import {Warp, WarpFactory, defaultCacheOptions} from 'warp-contracts'
import path from 'path';
import fs from 'fs';
import { VM2Plugin } from 'warp-contracts-plugin-vm2';
import {SqliteContractCache} from 'warp-contracts-sqlite'

type Status = {
  latestSortKey: string;
  stateHash: string;
  state: Record<string, any>;
  validity: Record<string, boolean>;
};

const mapStatus = new Map<string, Status>();

const volumeDir = './fileCache';
if (!fs.existsSync(volumeDir)) {
  fs.mkdirSync(volumeDir);
}
const dbLocation = path.join(volumeDir, 'warp/state');

const contractIds = [
  // $u
  'KTzTXT_ANmF84fWEKHzWURD1LWd9QaFR9yfYUwH2Lxw',
  // stamp
  'TlqASNDLA1Uh8yFiH-BzR_1FDag4s735F3PoUFEv2Mo'
]

// evaluationOptions get from https://dre-u.warp.cc/status
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
}

const smartweave = WarpFactory
    .forMainnet({
      ...defaultCacheOptions,
      dbLocation: dbLocation
    },)
    .use(new VM2Plugin())
    .useStateCache(
      new SqliteContractCache(
        {
          ...defaultCacheOptions,
          dbLocation: dbLocation
        },
        {
          maxEntriesPerContract: 20
        }
      )
    )

async function updateStatus(warp:Warp, contractTxId: string, evaluationOptions:any) {
  try {
    const contract = warp.contract(contractTxId)
    const result = await contract.setEvaluationOptions(evaluationOptions).readState();
    const stateHash = await contract.stateHash(result.cachedValue.state);
    // cache to memory
    mapStatus.set(contractTxId, { latestSortKey:result.sortKey, stateHash:stateHash, state: result.cachedValue.state, validity: result.cachedValue.validity });
  } catch (error) {
    console.log('readState from warp gateway error: error:', error, 'contractId:', contractTxId);
  }
}

function updateAllAsyncWarp() {
  console.log('start sync sw status from warp-gateway');

  return Promise.all(
    contractIds.map((contractId) => {
      return updateStatus(smartweave, contractId, evaluationOptions);
    })
  );
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitAndRun() {
  while (true) {
    await updateAllAsyncWarp();
    await wait(5 * 60 * 1000); // wait for 5 minutes
  }
}
waitAndRun();

// about api ---
export function getContractExecutedWarp(contractId: string, txId: string): boolean {
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

export function getTokenBalanceWarp(contractId: string, address: string): string {
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

export function getStateWarp(contractId: string): { state: any; validity: Record<string, boolean> } {
  if (mapStatus.has(contractId) == false) {
    return;
  }
  return mapStatus.get(contractId);
}
