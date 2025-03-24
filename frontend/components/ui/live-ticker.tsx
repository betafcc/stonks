import { FC, useEffect, useRef, useState } from 'react'
import { usePrice } from '@/hooks/react-binance'
import { cn } from '@/lib/utils'

export const LiveTicker: FC = () => {
  const price = usePrice('BTCUSDT')
  // is the current price lower than the previous?
  const [lower, setLower] = useState<boolean>(false)
  const previousRef = useRef<number | null>(null)

  useEffect(() => {
    if (price === null) return
    if (previousRef.current === null) {
      previousRef.current = price
    } else {
      setLower(price < previousRef.current)
      previousRef.current = price
    }
  }, [price])

  return (
    <div className="flex flex-col items-start w-full">
      <div className="p-3 border-b bg-secondary w-full">
        <h2 className="text-2xl font-bold">BTC/USDT</h2>
        <div
          className={cn(
            'font-bold mt-1 h-6',
            lower ? 'text-red-400' : 'text-emerald-500',
          )}
        >
          {price &&
            price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
        </div>
      </div>
      {/* <Separator /> */}
    </div>
  )
}
