"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const warp_gateway_cache_1 = require("./warp-gateway-cache");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.get('/ping', function (req, res) {
    res.send('pong');
});
// redstone-gateway-cache api
app.get('/warp/executedTx', function (req, res) {
    const contractId = req.param('contractId');
    const txId = req.param('txId');
    const result = (0, warp_gateway_cache_1.getContractExecutedWarp)(contractId, txId);
    res.send(result);
});
app.get('/warp/balance', function (req, res) {
    const contractId = req.param('contractId');
    const address = req.param('address');
    const result = (0, warp_gateway_cache_1.getTokenBalanceWarp)(contractId, address);
    res.send(result);
});
app.get('/warp/state/:contractId', function (req, res) {
    const contractId = req.params.contractId;
    const state = getStateWarp(contractId);
    res.send(state);
});
const server = app.listen(8080, function () {
    console.log('listen address: %s', JSON.stringify(server.address()));
});
