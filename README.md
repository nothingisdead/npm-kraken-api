Node Kraken
===========

NodeJS Client Library for the Kraken (kraken.com) API

This is an asynchronous node js client for the kraken.com API.

It exposes all the API methods found here: https://www.kraken.com/help/api through the 'api' method:

Example Usage:

```javascript
var Kraken = require('kraken-api');
var kraken = new Kraken('api_key', 'api_secret');

// Display user's balance
kraken.api('Balance', null, function(err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data.result);
    }
});

// Get Ticker Info
kraken.api('Ticker', {"pair": 'XBTCXLTC'}, function(err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data.result);
    }
});
```

Credit:

I used the example php implementation at https://github.com/payward/kraken-api-client and the python implementation at https://github.com/veox/krakenex as references.


Feeling generous? Send me a fraction of a bitcoin!

1Q85fXntTgYXZdiGZTnE3tqWhGWuinww31