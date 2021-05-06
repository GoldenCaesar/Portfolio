const express = require('express');
const decode = require('./decode.js');
const encode = require('./encode.js');
const cors = require('cors')
const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(cors())

app.get('/api/', (_req, res) => {
  res.send('hello world');
});

app.post('/api/encode', (req, res) => {
  const { string, password } = req.body;
  const result = encode(string, password);
  res.send(result);
});

app.post('/api/decode', (req, res) => {
  const { string, password } = req.body;
  const result = decode(string, password);
  res.send(result);
});

app.listen(process.env.PORT || 8080, () => {
  console.log('Starting Server on http://localhost:8080');
});
