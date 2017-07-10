declare module "kraken-api" {
    type Command = "Balance"| "TradeBalance"| "OpenOrders"| "ClosedOrders"| "QueryOrders"| "TradesHistory"|
        "QueryTrades"| "OpenPositions"| "Ledgers"| "QueryLedgers"| "TradeVolume"| "AddOrder"| "CancelOrder"|
        "DepositMethods"| "DepositAddresses"| "DepositStatus"| "WithdrawInfo"| "Withdraw"| "WithdrawStatus"|
        "WithdrawCancel"

    type Callback = (error: Error, success: any) => any

    class KrakenClient {
        constructor(key: string, secret: string, otp?: string, timeoutMs?: number)
        public api(command: Command, payload: object, cb?: Callback): void
    }

    export = KrakenClient
}