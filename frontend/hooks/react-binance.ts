import { Observable, concat, concatMap, from, map } from 'rxjs'
import {
  createAggTradeStream,
  createKlineStream,
  fetchKlines,
  KlineInterval,
} from 'common/binance'
import { useEffect, useState } from 'react'
import { OhlcData, Time } from 'lightweight-charts'

export const useCandles = (symbol: string, interval: KlineInterval) => {
  const [data, setData] = useState([] as OhlcData<Time>[])

  useEffect(() => {
    setData([])

    const subscription = createCandleStream(symbol, interval).subscribe({
      next: d => setData(data => [...data, d]),
      error: err => console.error(err),
    })

    return () => subscription.unsubscribe()
  }, [interval, symbol])

  return data
}

export const createCandleStream = (
  symbol: string,
  interval: KlineInterval,
): Observable<OhlcData<Time>> =>
  concat(
    from(
      fetchKlines({ symbol, interval }).then(lines =>
        lines.map(line => ({
          time: Math.floor(line[0] / 1000) as Time,
          open: +line[1],
          high: +line[2],
          low: +line[3],
          close: +line[4],
        })),
      ),
    ).pipe(concatMap(lines => from(lines))),
    createKlineStream(symbol, interval).pipe(
      map(msg => ({
        time: Math.floor(msg.k.t / 1000) as Time,
        open: +msg.k.o,
        high: +msg.k.h,
        low: +msg.k.l,
        close: +msg.k.c,
      })),
    ),
  )

export const usePrice = (symbol: string) => {
  const [price, setPrice] = useState<null | number>(null)

  useEffect(() => {
    const subscription = createPriceStream(symbol).subscribe({
      next: p => setPrice(p.value),
      error: err => console.error(err),
    })

    return () => subscription.unsubscribe()
  }, [symbol])

  return price
}

export const createPriceStream = (symbol: string) =>
  createAggTradeStream(symbol).pipe(map(t => ({ time: t.T, value: +t.p })))

// TODO: solve tail -F problem
// subscribe to stream first,
// get first value and keep buffering the rest
// check timestamp for first value,
// grab historical items until that first value
// yield historical values
// yield buffer
// yield live
// export const createGaplessStream = (params: {
//   symbol: string
//   startTime?: number
//   endTime?: number
//   limit?: number
// }): Observable<{ timestamp: number; price: string }> => {
//   const buffer: Array<{ timestamp: number; price: string }> = []

//   const interimSubscription = createAggTradeStream(params.symbol)
//     .pipe(map(o => ({ timestamp: o.T, price: o.p })))
//     .subscribe(trade => {
//       buffer.push(trade)
//     })

//   return new Observable(observer => {
//     ;(async () => {
//       try {
//         const historical = (await fetchAggTrades(params)).map(t => ({
//           timestamp: t.T,
//           price: t.p,
//         }))

//         const lastHistTimestamp = historical.at(-1)?.timestamp ?? 0

//         interimSubscription.unsubscribe()

//         const fresh = buffer.filter(t => t.timestamp > lastHistTimestamp)

//         for (const trade of [...historical, ...fresh]) observer.next(trade)

//         const liveSub = createAggTradeStream(params.symbol)
//           .pipe(map(o => ({ timestamp: o.T, price: o.p })))
//           .subscribe({
//             next: trade => observer.next(trade),
//             error: err => observer.error(err),
//             complete: () => observer.complete(),
//           })

//         return () => liveSub.unsubscribe()
//       } catch (err) {
//         observer.error(err)
//       }
//     })()

//     return () => interimSubscription.unsubscribe()
//   })
// }
