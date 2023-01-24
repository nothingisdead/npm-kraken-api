import { createHash, createHmac } from "crypto";
import got from "got";
import { Headers } from "got";
import { stringify } from "qs";

// Public/Private method names
type PublicMethod =
  | "Time"
  | "Assets"
  | "AssetPairs"
  | "Ticker"
  | "Depth"
  | "Trades"
  | "Spread"
  | "OHLC";

type PrivateMethod =
  | "Balance"
  | "TradeBalance"
  | "OpenOrders"
  | "ClosedOrders"
  | "QueryOrders"
  | "TradesHistory"
  | "QueryTrades"
  | "OpenPositions"
  | "Ledgers"
  | "QueryLedgers"
  | "TradeVolume"
  | "AddOrder"
  | "CancelOrder"
  | "DepositMethods"
  | "DepositAddresses"
  | "DepositStatus"
  | "WithdrawInfo"
  | "Withdraw"
  | "WithdrawStatus"
  | "WithdrawCancel"
  | "GetWebSocketsToken";

interface DefaultOptions {
  url: string;
  version: number;
  timeout: number;
}

// Default options
const defaults: DefaultOptions = {
  url: "https://api.kraken.com",
  version: 0,
  timeout: 5000,
};

interface KrakenClientOptions {
  otp: string; // Two-factor password (optional) (also, doesn't work)
  timeout: number | undefined; // Maximum timeout (in milliseconds) for all API-calls (passed to `request`)
}

interface Options {
  otp: string;
  timeout: number;
  url: string;
  version: number;
}

// Create a signature for a request
const getMessageSignature = (
  path: string,
  request: Record<string, any>,
  secret: string,
  nonce: string
) => {
  const message = stringify(request);
  const secret_buffer = new Buffer(secret, "base64");
  const hash = createHash("sha256");
  const hmac = createHmac("sha512", secret_buffer);
  const hash_digest = hash.update(nonce + message).digest("base64");
  const hmac_digest = hmac.update(path + hash_digest, "utf8").digest("base64");

  return hmac_digest;
};

// Send an API request
const rawRequest = async (
  url: string,
  headers: Headers,
  data: any,
  timeout: number
) => {
  // Set custom User-Agent string
  headers["User-Agent"] = "Kraken Javascript API Client";

  const options = { headers, timeout };

  Object.assign(options, {
    method: "POST",
    body: stringify(data),
  });
  const { body } = await got(url, options as any);
  const response = JSON.parse(body);

  if (response.error && response.error.length) {
    const error = response.error
      .filter((e: string) => e.startsWith("E"))
      .map((e: string) => e.slice(1));

    if (!error.length) {
      throw new Error("Kraken API returned an unknown error");
    }

    throw new Error(error.join(", "));
  }

  return response;
};

export default class KrakenClient {
  key: string; // API Key
  secret: string; // API Secret
  options: Options;

  constructor(
    key: string,
    secret: string,
    options: string | KrakenClientOptions
  ) {
    // Allow passing the OTP as the third argument for backwards compatibility
    if (typeof options === "string") {
      options = { otp: options, timeout: undefined };
    }

    this.key = key;
    this.secret = secret;
    this.options = {
      otp: options.otp,
      timeout: options.timeout ? options.timeout : defaults.timeout,
      version: defaults.version,
      url: defaults.url,
    };
  }

  /* This method makes a public API request. */
  async publicMethod(
    method: PublicMethod, // The API Method (public or private)
    params: Record<string, any>, // Arguments to pass to the api call
    callback: (err: Error | null, res: any) => void // A callback function to be executed when the request is complete
  ): Promise<any> {
    params = params || {};

    const path = "/" + this.options.version + "/public/" + method;
    const url = this.options.url + path;

    const response = rawRequest(url, {}, params, this.options.timeout);

    if (typeof callback === "function") {
      response
        .then((result) => callback(null, result))
        .catch((error) => callback(error, null));
    }

    return response;
  }

  /* This method makes a private API request. */
  async privateMethod(
    method: PrivateMethod, // The API method (public or private)
    params: Record<string, any>, // Arguments to pass to the api call
    callback: (err: Error | null, res: any) => void // A callback function to be executed when the request is complete
  ): Promise<any> {
    const path = "/" + this.options.version + "/private/" + method;
    const url = this.options.url + path;

    if (!params.hasOwnProperty("nonce")) {
      params.nonce = new Date().getTime() * 1000; // spoof microsecond
    }

    if (this.options.otp !== undefined) {
      params.otp = this.options.otp;
    }

    const signature = getMessageSignature(
      path,
      params,
      this.secret,
      params.nonce
    );

    const headers = {
      "API-Key": this.key,
      "API-Sign": signature,
    };

    const response = rawRequest(url, headers, params, this.options.timeout);

    response
      .then((result) => callback(null, result))
      .catch((error) => callback(error, null));

    return response;
  }
}
