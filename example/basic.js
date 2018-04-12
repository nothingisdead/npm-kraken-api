const key = process.env.KRAKEN_API_KEY 			// replace your key here
const secret = process.env.KRAKEN_API_SECRET	// replace your secret here
const KrakenClient = require('../kraken.js')

(async () => {
	// Display user's balance
	console.log(await kraken.api('Balance'));

	// Get Ticker Info
	console.log(await kraken.api('Ticker', { pair : 'XXBTZUSD' }));
})();