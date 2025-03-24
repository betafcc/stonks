'use client'

import { useCallback, useState } from 'react'
import { Menu, TrendingDown, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-mobile'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { NavBar } from '@/components/ui/nav-bar'
import { SidePanel } from '@/components/ui/side-panel'
import { LiveTicker } from '@/components/ui/live-ticker'
import { LiveChartPanel } from '@/components/ui/live-chart-panel'
import { Timer } from '@/components/ui/timer'
import { Panel } from '@/hooks/app'

export default function Page() {
  const [activeSidebar, setActiveSidebar] = useState<Panel>()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          <h1 className="text-xl font-semibold">STONKS!</h1>
        </div>
        <div className="flex gap-2">
          <ModeToggle />
          <Button>Login</Button>
        </div>
      </header>

      <div className="flex flex-1">
        <NavBar
          selected={activeSidebar}
          onSelect={setActiveSidebar}
        />
        <SidePanel
          className="fixed left-20 bottom-8 top-16"
          selected={activeSidebar}
          onClose={() => setActiveSidebar(undefined)}
        />
        <div className="flex-1 p-2 w-40">
          <LiveChartPanel
            symbol="BTCUSDT"
            interval="1s"
            className="h-[calc(100vh-7rem)]"
          />
        </div>
        <div className="flex min-w-40 max-w-40 flex-col border-l bg-muted/40 py-0 gap-4">
          <LiveTicker />
          <Button
            // variant={selected === value ? 'secondary' : 'ghost'}
            size="lg"
            className="flex flex-col py-10 w-32 h-32 mx-auto cursor-pointer bg-emerald-400 text-foreground rounded-xs"
            // onClick={() => onSelect?.(value === selected ? null : value)}
          >
            <TrendingUp className="min-w-10 min-h-10" />
            <span>Higher</span>
          </Button>
          <Button
            // variant={selected === value ? 'secondary' : 'ghost'}
            size="lg"
            className="flex flex-col py-10 w-32 h-32 mx-auto cursor-pointer bg-red-400 text-foreground rounded-xs"
            // onClick={() => onSelect?.(value === selected ? null : value)}
          >
            <TrendingDown className="min-w-10 min-h-10" />
            <span>Lower</span>
          </Button>
          <Timer
            duration={10000}
            onTimeout={useCallback(() => console.log('done'), [])}
            className="h-[120px] w-[120px] self-center"
          />
        </div>
      </div>
      <footer className="flex h-8 items-center justify-between border-t px-4 md:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">My Application</h2>
        </div>
      </footer>
    </div>
  )
}
