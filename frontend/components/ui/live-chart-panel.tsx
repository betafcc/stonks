'use client'
import { ComponentProps, FC, useState } from 'react'
import { LiveChart, LiveChartType } from './live-chart'
import { ChartSwitch } from './chart-switch'
import { cn } from '@/lib/utils'

type LiveChartProps = ComponentProps<typeof LiveChart>

export const LiveChartPanel: FC<
  Omit<LiveChartProps, 'type'> &
    Omit<ComponentProps<'div'>, keyof LiveChartProps>
> = ({ symbol, interval, disableScale, className, ...props }) => {
  const [type, setType] = useState<LiveChartType>('candle')

  return (
    <div className={cn('relative', className)} {...props}>
      <ChartSwitch
        value={type}
        onValueChange={setType}
        className="absolute top-1 left-1 z-50 w-28"
      />
      <LiveChart
        symbol={symbol}
        interval={interval}
        disableScale={disableScale}
        type={type}
      />
    </div>
  )
}
