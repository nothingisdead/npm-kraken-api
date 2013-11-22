var request		= require('request');
var crypto		= require('crypto');
var querystring	= require('querystring');
var microtime	= require('microtime');

/**
 * KrakenClient connects to the Kraken.com API
 * @param {String} key    API Key
 * @param {String} secret API Secret
 * @param {String} [otp]  Two-factor password (optional) (also, doesn't work)
 */
function KrakenClient(key, secret, otp) {
	var self = this;

	var config = {
		url: 'https://api.kraken.com',
		version: '0',
		key: key,
		secret: secret,
		otp: otp
	};

	/**
	 * This method makes a public or private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	function api(method, params, callback) {
		var methods = {
			public: ['Time', 'Assets', 'AssetPairs', 'Ticker', 'Depth', 'Trades', 'Spread'],
			private: ['Balance', 'TradeBalance', 'OpenOrders', 'ClosedOrders', 'QueryOrders', 'TradesHistory', 'QueryTrades', 'OpenPositions', 'Ledgers', 'QueryLedgers', 'TradeVolume', 'AddOrder', 'CancelOrder']
		};
		if(methods.public.indexOf(method) !== -1) {
			return publicMethod(method, params, callback);
		}
		else if(methods.private.indexOf(method) !== -1) {
			return privateMethod(method, params, callback);
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
	function publicMethod(method, params, callback) {
		params = params || {};

		var path	= '/' + config.version + '/public/' + method;
		var url		= config.url + path;

		return rawRequest(url, {}, params, callback);
	}

	/**
	 * This method makes a private API request.
	 * @param  {String}   method   The API method (public or private)
	 * @param  {Object}   params   Arguments to pass to the api call
	 * @param  {Function} callback A callback function to be executed when the request is complete
	 * @return {Object}            The request object
	 */
	function privateMethod(method, params, callback) {
		params = params || {};

		var path	= '/' + config.version + '/private/' + method;
		var url		= config.url + path;

		params.nonce = microtime.now();

		// Two-factor authentication doesn't seem to work for API requests.
		// I need to contact Kraken support about this.
		// if(config.otp !== undefined) {
		// 	params.otp = config.otp;
		// }

		var signature = getMessageSignature(path, params, params.nonce);

		var headers = {
			'API-Key': config.key,
			'API-Sign': signature
		};

		return rawRequest(url, headers, params, callback);
	}

	/**
	 * This method returns a signature for a request as a Base64-encoded string
	 * @param  {String}  path    The relative URL path for the request
	 * @param  {Object}  request The POST body
	 * @param  {Integer} nonce   A unique, incrementing integer
	 * @return {String}          The request signature
	 */
	function getMessageSignature(path, request, nonce) {
		var secret	= new Buffer(config.secret, 'base64');
		var message	= querystring.stringify(request);

		var hash = sha256(nonce + message);
		var hmac = hmac_sha512(path + hash.toString('binary'), secret);

		return hmac.toString('base64');
	}

	/**
	 * This method sends the actual HTTP request
	 * @param  {String}   url      The URL to make the request
	 * @param  {Object}   headers  Request headers
	 * @param  {Object}   params   POST body
	 * @param  {Function} callback A callback function to call when the request is complete
	 * @return {Object}            The request object
	 */
	function rawRequest(url, headers, params, callback) {
		// Set custom User-Agent string
		headers['User-Agent'] = 'Kraken Javascript API Client';

		var options = {
			url: url,
			method: 'POST',
			headers: headers,
			form: params
		};

		var req = request.post(options, function(error, response, body) {
			if(error) {
				throw new Error('Error in server response: ' + JSON.stringify(error));
			}
			else if(typeof callback === 'function') {
				try {
					callback.call(self, body);
				}
				catch(e) {
					throw new Error('Could not understand response from server.');
				}
			}
		});

		return req;
	}

	/**
	 * A helper function to get a SHA256 hash
	 * @param  {String} input Input string
	 * @return {Object}       Output hash as a Buffer object
	 */
	function sha256(input) {
		var hash = new crypto.createHash('sha256');

		hash.write(input);
		hash.end();

		var buffer = new Buffer(hash.read());

		return buffer;
	}

	/**
	 * A helper function to get a SHA512-encrypted signature
	 * @param  {String} message The message to sign
	 * @param  {String} secret  The secret (private) key
	 * @return {Object}         Output hash as a Buffer object
	 */
	function hmac_sha512(message, secret) {
		var hmac = new crypto.createHmac('sha512', secret);

		hmac.write(message);
		hmac.end();

		var buffer = new Buffer(hmac.read());

		return buffer;
	}

	self.api			= api;
	self.publicMethod	= publicMethod;
	self.privateMethod	= privateMethod;
}

module.exports = KrakenClient;