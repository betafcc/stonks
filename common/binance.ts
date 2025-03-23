/**
 * Lower level binance api.
 * Based on https://developers.binance.com/docs/binance-spot-api-docs/README
 */

import qs from 'qs'

import { webSocket } from 'rxjs/webSocket'
import { retry } from 'rxjs/operators'

export const HOST = 'https://api.binance.com/api/v3'

export const WS_HOST = 'wss://stream.binance.com:9443/ws'

export type AggTrade = {
  /** Aggregate trade ID */
  a: number
  /** Price */
  p: string
  /** Quantity */
  q: string
  /** First trade ID */
  f: number
  /** Last trade ID */
  l: number
  // NOTE: there may be consecutive AggTrade with same Trade time
  /** Trade time */
  T: number
  /** Is the buyer the market maker? */
  m: boolean
  /** Ignore */
  M: boolean
}

export type AggTradeMessage = {
  /** Event type */
  e: string
  /** Event time */
  E: number
  /** Symbol */
  s: string
} & AggTrade

/**
 * The Aggregate Trade Streams push trade information that is aggregated for a single taker order.
 *
 * @see https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams#aggregate-trade-streams
 */
export const createAggTradeStream = (symbol: string) =>
  webSocket<AggTradeMessage>(
    `${WS_HOST}/${symbol.toLowerCase()}@aggTrade`,
  ).pipe(retry({ delay: 3000 }))

/**
 * Get compressed, aggregate trades. Trades that fill at the time, from the same taker order, with the same price will have the quantity aggregated.
 *
 * @see https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#compressedaggregate-trades-list
 */
export const fetchAggTrades = async (params: {
  symbol: string
  startTime?: number
  endTime?: number
  limit?: number
}): Promise<Array<AggTrade>> =>
  await fetch(
    `${HOST}/aggTrades?` +
      qs.stringify({ ...params, symbol: params.symbol.toUpperCase() }),
  ).then(r => r.json())

export type KlineTuple = [
  /** Kline open time */
  number,
  /** Open price */
  string,
  /** High price */
  string,
  /** Low price */
  string,
  /** Close price */
  string,
  /** Volume */
  string,
  /** Kline Close time */
  number,
  /** Quote asset volume */
  string,
  /** Number of trades */
  number,
  /** Taker buy base asset volume */
  string,
  /** Taker buy quote asset volume */
  string,
  /** Unused field, ignore */
  string,
]

export type KlineInterval =
  | '1s'
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M'

export type KlineMessage = {
  /** Event type */
  e: string
  /** Event time */
  E: number
  /** Symbol */
  s: string
  k: {
    /** Kline start time */
    t: number
    /** Kline close time */
    T: number
    /** Symbol */
    s: string
    /** Interval */
    i: KlineInterval
    /** First trade ID */
    f: number
    /** Last trade ID */
    L: number
    /** Open price */
    o: string
    /** Close price */
    c: string
    /** High price */
    h: string
    /** Low price */
    l: string
    /** Base asset volume */
    v: string
    /** Number of trades */
    n: number
    /** Is this kline closed? */
    x: boolean
    /** Quote asset volume */
    q: string
    /** Taker buy base asset volume */
    V: string
    /** Taker buy quote asset volume */
    Q: string
    /** Ignore */
    B: string
  }
}

/**
 * The Kline/Candlestick Stream push updates to the current klines/candlestick every second in UTC+0 timezone
 *
 * @see https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams#klinecandlestick-streams-for-utc
 */
export const createKlineStream = (symbol: string, interval: KlineInterval) =>
  webSocket<KlineMessage>(
    `${WS_HOST}/${symbol.toLowerCase()}@kline_${interval}`,
  ).pipe(retry({ delay: 3000 }))

/**
 * Kline/candlestick bars for a symbol. Klines are uniquely identified by their open time.
 *
 * @see https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#klinecandlestick-data
 */
export const fetchKlines = async (params: {
  symbol: string
  interval: KlineInterval
  startTime?: number
  endTime?: number
  limit?: number
}): Promise<Array<KlineTuple>> =>
  await fetch(
    `${HOST}/klines?` +
      qs.stringify({ ...params, symbol: params.symbol.toUpperCase() }),
  ).then(r => r.json())

/**
 * Fetches the first trade info that has price different from `value`,
 * with `timestamp` as the start time
 */
export const fetchFirstPriceChange = async (params: {
  symbol: string
  timestamp: number
  value: number
  backoff?: number
}): Promise<{ symbol: string; timestamp: number; value: number }> => {
  if (params.timestamp > Date.now())
    throw new Error('timestamp must be in the past')

  const trades = await fetchAggTrades({
    symbol: params.symbol,
    startTime: params.timestamp,
  })

  if (trades.length === 0)
    throw new Error('no trades found for the given timestamp')

  const firstChange = trades.find(t => +t.p !== params.value)

  if (firstChange)
    return {
      symbol: params.symbol,
      timestamp: firstChange.T,
      value: +firstChange.p,
    }

  await new Promise(r => setTimeout(r, params.backoff ?? 1000))

  return fetchFirstPriceChange({
    ...params,
    timestamp: trades.at(-1)!.T,
    // backoff: (params.backoff ?? 1000) * 2,
  })
}
