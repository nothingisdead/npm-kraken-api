const request     = require('request');
const crypto      = require('crypto');
const querystring = require('qs');

// Public/Private method names
const methods = {
	public  : [ 'Time', 'Assets', 'AssetPairs', 'Ticker', 'Depth', 'Trades', 'Spread', 'OHLC' ],
	private : [ 'Balance', 'TradeBalance', 'OpenOrders', 'ClosedOrders', 'QueryOrders', 'TradesHistory', 'QueryTrades', 'OpenPositions', 'Ledgers', 'QueryLedgers', 'TradeVolume', 'AddOrder', 'CancelOrder', 'DepositMethods', 'DepositAddresses', 'DepositStatus', 'WithdrawInfo', 'Withdraw', 'WithdrawStatus', 'WithdrawCancel' ],
};

// Default options
const defaults = {
	url     : 'https://api.kraken.com',
	version : 0,
	timeout : 5000,
};

/**
 * KrakenClient connects to the Kraken.com API
 * @param {String}        key               API Key
 * @param {String}        secret            API Secret
 * @param {String|Object} [options={}]      Additional options. If a string is passed, will default to just setting `options.otp`.
 * @param {String}        [options.otp]     Two-factor password (optional) (also, doesn't work)
 * @param {Number}        [options.timeout] Maximum timeout (in milliseconds) for all API-calls (passed to `request`)
 */
class KrakenClient {
	constructor(key, secret, options) {
		// Allow passing the OTP as the third argument for backwards compatibility
		if(typeof options === 'string') {
			options = { otp : options };
		}

		this.config = Object.assign({ key, secret }, defaults, options);
	}

	/**
	 * This method makes a public or private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	api(method, params, callback) {
		if(methods.public.indexOf(method) !== -1) {
			return this.publicMethod(method, params, callback);
		}
		else if(methods.private.indexOf(method) !== -1) {
			return this.privateMethod(method, params, callback);
		}
		else {
			throw new Error(method + ' is not a valid API method.');
		}
	}

	/**
	 * This method makes a public API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	publicMethod(method, params, callback) {
		params = params || {};

		const path = '/' + this.config.version + '/public/' + method;
		const url  = this.config.url + path;

		return this.rawRequest(url, {}, params, callback);
	}

	/**
	 * This method makes a private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	privateMethod(method, params, callback) {
		params = params || {};

		const path = '/' + this.config.version + '/private/' + method;
		const url  = this.config.url + path;

		if(!params.nonce) {
			params.nonce = new Date() * 1000; // spoof microsecond
		}

		if(this.config.otp !== undefined) {
			params.otp = this.config.otp;
		}

		const signature = this.getMessageSignature(path, params, params.nonce);

		const headers = {
			'API-Key'  : this.config.key,
			'API-Sign' : signature,
		};

		return this.rawRequest(url, headers, params, callback);
	}

	/**
	 * This method returns a signature for a request as a Base64-encoded string
	 * @param  {String}  path    The relative URL path for the request
	 * @param  {Object}  request The POST body
	 * @param  {Integer} nonce   A unique, incrementing integer
	 * @return {String}          The request signature
	 */
	getMessageSignature(path, request, nonce) {
		const message     = querystring.stringify(request);
		const secret      = new Buffer(this.config.secret, 'base64');
		const hash        = new crypto.createHash('sha256');
		const hmac        = new crypto.createHmac('sha512', secret);
		const hash_digest = hash.update(nonce + message).digest('binary');
		const hmac_digest = hmac.update(path + hash_digest, 'binary').digest('base64');

		return hmac_digest;
	}

	/**
	 * This method sends the actual HTTP request
	 * @param  {String}   url      The URL to make the request
	 * @param  {Object}   headers  Request headers
	 * @param  {Object}   params   POST body
	 * @param  {Function} callback A callback function to call when the request is complete
	 * @return {Object}            The request object
	 */
	rawRequest(url, headers, params, callback) {
		// Set custom User-Agent string
		headers['User-Agent'] = 'Kraken Javascript API Client';

		const options = {
			url     : url,
			method  : 'POST',
			headers : headers,
			form    : params,
			timeout : this.config.timeout,
		};

		const req = request.post(options, function(error, response, body) {
			if (typeof callback === 'function') {
				let data;

				if (error) {
					return callback(new Error('Error in server response: ' + JSON.stringify(error)), null);
				}

				try {
					data = JSON.parse(body);
				}
				catch (e) {
					return callback(new Error('Could not understand response from server: ' + body), null);
				}

				// If any errors occured, Kraken will give back an array with error strings under
				// the key "error". We should then propagate back the error message as a proper error.
				if(data.error && data.error.length) {
					let krakenError = null;

					data.error.forEach(function(element) {
						if (element.charAt(0) === "E") {
							krakenError = element.substr(1);
							return false;
						}
					});
					if (krakenError) {
						return callback(new Error('Kraken API returned error: ' + krakenError), null);
					}
					else {
						return callback(new Error('Kraken API returned an unknown error'), null);
					}
				}
				else {
					return callback(null, data);
				}
			}
		});

		return req;
	}
}

module.exports = KrakenClient;
