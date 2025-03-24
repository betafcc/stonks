import { ComponentProps, FC } from 'react'
import { ChartCandlestick, ChartLine } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from './tabs'
import { LiveChartType } from './live-chart'

export const ChartSwitch: FC<
  {
    value: LiveChartType
    onValueChange: (value: LiveChartType) => void
  } & Omit<ComponentProps<typeof Tabs>, 'value' | 'onValueChange'>
> = ({ value, onValueChange, ...props }) => (
  <Tabs
    value={value}
    onValueChange={onValueChange as (value: string) => void}
    {...props}
  >
    <TabsList className="grid w-full grid-cols-2 border-1">
      <TabsTrigger value="candle" className="cursor-pointer">
        <ChartCandlestick />
      </TabsTrigger>
      <TabsTrigger value="line" className="cursor-pointer">
        <ChartLine />
      </TabsTrigger>
    </TabsList>
  </Tabs>
)
