'use client'
import { ComponentProps, FC } from 'react'
import { Time } from 'lightweight-charts'
import {
  CandlestickSeries,
  Chart,
  LineSeries,
  TimeScale,
} from 'lightweight-charts-react-wrapper'
import { useCandles } from '@/hooks/react-binance'
import { KlineInterval } from 'common/binance'
import { useTheme } from 'next-themes'

// // https://github.com/tradingview/lightweight-charts/issues/1426
// const whiteSpaceSeries = (
//   data: {
//     time: number
//     value: number
//   }[],
// ) => {
//   if (data.length === 0) return []

//   const [low, high] = extent(data.map(d => d.time)) as [number, number]

//   return range(low - 300, high + 300).map(n => ({ time: n }))
// }

const tickMarkFormatter = (time: Time): string => {
  const date = new Date((time as number) * 1000)

  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const containerOptions: ComponentProps<typeof Chart>['container'] = {
  style: { width: '100%', height: '100%' },
}

export type LiveChartType = 'candle' | 'line'

// TODO: make stateless LiveChartView
export const LiveChart: FC<{
  symbol: string
  interval: KlineInterval
  type?: LiveChartType
  disableScale?: boolean
}> = ({ symbol, interval, type = 'candle', disableScale = false }) => {
  const { theme } = useTheme()
  const candles = useCandles(symbol, interval)

  return (
    <Chart
      container={containerOptions}
      grid={{
        vertLines: {
          color: theme === 'dark' ? '#333' : '#ddd',
        },
        horzLines: {
          color: theme === 'dark' ? '#333' : '#ddd',
        },
      }}
      layout={{
        background: {
          color: theme === 'dark' ? '#222' : '#ffffff',
        },
        textColor: theme === 'dark' ? '#aaa' : '#222',
      }}
      autoSize
      handleScale={!disableScale}
    >
      {type === 'candle' ? (
        <CandlestickSeries reactive data={candles} />
      ) : (
        <LineSeries
          reactive
          data={candles.map(d => ({ time: d.time, value: d.close }))}
          // baseLineWidth={1}
          lineWidth={2}
          // autoscaleInfoProvider={false}
          lastPriceAnimation={2}
        />
      )}
      <TimeScale
        // rightOffset={30}
        // fixRightEdge
        // barSpacing={0}
        timeVisible={true}
        // uniformDistribution
        // lockVisibleTimeRangeOnResize
        tickMarkFormatter={tickMarkFormatter}
      />
    </Chart>
  )
}
