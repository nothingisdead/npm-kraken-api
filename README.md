npm-kraken-api
==============

NodeJS Client Library for the Kraken (kraken.com) API

This is an asynchronous node js client for the kraken.com API.

It exposes all the API methods found here: https://www.kraken.com/help/api through the 'api' method:

Example Usage:

```javascript
var market = 'LTCBTC';
var kraken = require('kraken-api');
var client = new KrakenClient('api_key', 'api_secret');

// Display user's balance
client.api('Balance', null, function(response) {
	console.log('Balances:', response.result);
});
```

Credit:

I used the example php implementation at https://github.com/payward/kraken-api-client and the python implementation at https://github.com/veox/krakenex as references.
