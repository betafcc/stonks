'use client'

import { FC, useEffect, useState } from 'react'
import {
  CircleArrowDown,
  CircleArrowUp,
  LogOut,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { NavBar } from '@/components/ui/nav-bar'
import { SidePanel } from '@/components/ui/side-panel'
import { LiveTicker } from '@/components/ui/live-ticker'
import { LiveChartPanel } from '@/components/ui/live-chart-panel'
import { Timer } from '@/components/ui/timer'
import { Command, State, useApp } from '@/hooks/app'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function Page() {
  const [state, command] = useApp()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )} */}
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
        <NavBar
          isLoggedIn={!!state.user}
          selected={state.panel}
          onSelect={command.selectPanel}
        />
        <SidePanel
          className="fixed left-20 bottom-8 top-16"
          selected={state.panel}
          onClose={command.closePanel}
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
          {state.user ? (
            <GameControls command={command} state={state} />
          ) : (
            <p className="text-center">Sign up to play</p>
          )}
        </div>
      </div>
      <footer className="flex h-8 items-center justify-between border-t px-4 md:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            Copyright © 1969-2025 Stonks of America, Inc.
          </h2>
        </div>
      </footer>
    </div>
  )
}

// TODO: refactor to pure ui component
const GameControls: FC<{ command: Command; state: State }> = ({
  command,
  state,
}) => {
  // NOTE: this logic should live on `useApp`, but is surprisingly nasty
  // handling a "timer" state in react
  const [timerDuration, setTimerDuration] = useState<null | number>(null)

  useEffect(() => {
    if (state.game.type !== 'waiting-result') return
    const bet = state.game.bet
    const initialTime = +new Date(bet.initialTime)
    const minFinalTime = initialTime + 60000
    const duration = minFinalTime - Date.now()

    if (duration <= 0) {
      command.retrieveBetResult(bet)
    } else {
      setTimerDuration(duration)

      const timeoutId = setTimeout(() => {
        command.retrieveBetResult(bet)
      }, duration)

      return () => clearTimeout(timeoutId)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.game.type])

  if (state.game.type === 'idle' || state.game.type === 'waiting-bet') {
    return (
      <>
        <Button
          disabled={state.game.type === 'waiting-bet'}
          size="lg"
          className="flex flex-col py-10 w-32 h-32 mx-auto cursor-pointer bg-emerald-400 text-white rounded-xs"
          onClick={() => command.createBet(state.symbol, 'up')}
        >
          <TrendingUp className="min-w-10 min-h-10" />
          <span>Higher</span>
        </Button>
        <Button
          disabled={state.game.type === 'waiting-bet'}
          size="lg"
          className="flex flex-col py-10 w-32 h-32 mx-auto cursor-pointer bg-red-400 text-white rounded-xs"
          onClick={() => command.createBet(state.symbol, 'down')}
        >
          <TrendingDown className="min-w-10 min-h-10" />
          <span>Lower</span>
        </Button>
      </>
    )
  }

  return (
    timerDuration !== null && (
      <>
        <CurrentBetView
          price={state.game.bet.initial}
          direction={state.game.bet.direction}
        />
        <Timer
          key={state.game.bet.id}
          duration={timerDuration}
          className="h-[120px] w-[120px] self-center"
        />
      </>
    )
  )
}

// TODO: move to components/ui
const CurrentBetView: FC<{ price: number; direction: 'up' | 'down' }> = ({
  price,
  direction,
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className={cn('font-bold mt-1 h-full')}>
        {price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      {direction === 'up' ? (
        <CircleArrowUp size={15} />
      ) : (
        <CircleArrowDown size={15} />
      )}
    </div>
  )
}
