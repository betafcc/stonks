'use client'

import { useCallback, useState } from 'react'
import { LogOut, Menu, TrendingDown, TrendingUp } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'

import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-mobile'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { NavBar } from '@/components/ui/nav-bar'
import { SidePanel } from '@/components/ui/side-panel'
import { LiveTicker } from '@/components/ui/live-ticker'
import { LiveChartPanel } from '@/components/ui/live-chart-panel'
import { Timer } from '@/components/ui/timer'
import { makeUseApp, Panel } from '@/hooks/app'
import { api } from '@/lib/api'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

const useApp = makeUseApp(api)

export default function Page() {
  const [state, command] = useApp()
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
          {state.user && (
            <>
              {state.user.picture && (
                <Image
                  alt="Picture"
                  src={state.user.picture}
                  width="40"
                  height="40"
                  className="rounded-full border-1"
                />
              )}

              <div className="flex flex-col h-full pr-2 text-sm">
                <div className="font-bold">
                  {state.user.email.split('@')[0]}
                </div>
                <div className="text-left">
                  Score:{' '}
                  <span className="font-mono text-right">
                    {state.user.score}
                  </span>
                </div>
              </div>
            </>
          )}
          {state.user ? (
            <Button
              variant="outline"
              className="cursor-pointer h-10 w-10 rounded-sm"
              aria-label="Log out"
              title="Log out"
              onClick={command.logout}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          ) : (
            <div className="[&_div]:bg-background [&_div]:text-foreground">
              <GoogleLogin
                size="large"
                text="signin"
                onSuccess={async credentialResponse =>
                  command.login(credentialResponse.credential!)
                }
                onError={() => {
                  console.log('Login Failed')
                }}
              />
            </div>
          )}
          <Separator orientation="vertical" className="min-h-8 self-center" />
          <ModeToggle
            className="cursor-pointer h-10 w-10 rounded-sm"
            aria-label="Toggle theme"
            title="Toggle theme"
          />
        </div>
      </header>

      <div className="flex flex-1">
        <NavBar selected={activeSidebar} onSelect={setActiveSidebar} />
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
