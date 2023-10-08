import express from 'express';
import cors from 'cors';
import { getContractExecutedWarp, getStateWarp, getTokenBalanceWarp } from './warp-gateway-cache';
const app = express();
app.use(cors());

app.get('/ping', function (req, res) {
  res.send('pong');
});

// redstone-gateway-cache api
app.get('/warp/executedTx', function( req,res) {
  const contractId = req.param('contractId');
  const txId = req.param('txId');
  const result = getContractExecutedWarp(contractId, txId);
  res.send(result);
});

app.get('/warp/balance', function (req, res) {
  const contractId = req.param('contractId');
  const address = req.param('address');
  const result = getTokenBalanceWarp(contractId, address);
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

