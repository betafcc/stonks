import { LiveChart } from '@/components/ui/live-chart'

export default function Home() {
  return (
    <div className="w-[100vw] h-[100vh]">
      <LiveChart symbol="BTCUSDT" interval="1s" type="candle" />
    </div>
  )
}
