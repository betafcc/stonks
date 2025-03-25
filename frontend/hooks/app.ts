import { useEffect, useReducer, useRef } from 'react'
import type { RouterOutputs } from '../../backend/router'
import { api } from '@/lib/api'

export type User = NonNullable<RouterOutputs['getUserById']>
export type Bet = NonNullable<RouterOutputs['getActiveBet']>

export type Direction = 'up' | 'down'

export type Panel = 'profile' | 'history' | 'rank'

export type GameState =
  | { type: 'idle' }
  | { type: 'waiting-bet' }
  | { type: 'waiting-result'; bet: Bet }

export type State = {
  user: User | null
  panel: Panel | null
  game: GameState
  symbol: string
  history: Bet[] | null
  rank: User[] | null
}

export const initial: State = {
  user: null,
  panel: null,
  game: { type: 'idle' },
  symbol: 'BTCUSDT',
  history: null,
  rank: null,
}

export type Event =
  | { type: 'logged-in'; user: User }
  | { type: 'logged-out' }
  | { type: 'requested-bet' }
  | { type: 'got-bet'; bet: Bet }
  | { type: 'got-result'; bet: Bet }
  | { type: 'got-history'; history: Bet[] }
  | { type: 'got-rank'; rank: User[] }
  | { type: 'closed-panel' }
  | { type: 'selected-panel'; panel: Panel }

export const reducer = (state: State, event: Event): State => {
  switch (event.type) {
    case 'logged-in':
      return { ...state, user: event.user }
    case 'logged-out':
      return { ...state, user: null }
    case 'requested-bet':
      return { ...state, game: { type: 'waiting-bet' } }
    case 'got-bet':
      return { ...state, game: { type: 'waiting-result', bet: event.bet } }
    case 'got-result': {
      const finalBet = event.bet
      const isCorrect =
        (finalBet.final! > finalBet.initial && finalBet.direction === 'up') ||
        (finalBet.final! < finalBet.initial && finalBet.direction === 'down')

      return {
        ...state,
        user: {
          ...state.user!,
          score: isCorrect ? state.user!.score + 1 : state.user!.score - 1,
        },
        game: { type: 'idle' },
        history: [...(state.history ?? []), event.bet],
      }
    }
    case 'got-history':
      return { ...state, history: event.history }
    case 'got-rank':
      return { ...state, rank: event.rank }
    case 'closed-panel':
      return { ...state, panel: null }
    case 'selected-panel':
      return { ...state, panel: event.panel }
  }
}

export const useApp = (initialState?: Partial<State>) => {
  const [state, dispatch] = useReducer(reducer, { ...initial, ...initialState })
  const stateRef = useRef(state)
  // rerender avoiding evil trick
  stateRef.current = state
  const command = useRef({
    login: async (credential: string) => {
      const { token, user, activeBet } = await api.login.mutate({ credential })
      localStorage.setItem('token', token)
      dispatch({ type: 'logged-in', user })

      if (activeBet) {
        dispatch({ type: 'got-bet', bet: activeBet })

        if (+new Date(activeBet.initialTime) + 60 * 1000 < Date.now()) {
          // if activeBet is already 1 minute old, request result
          await command.current.retrieveBetResult(activeBet)
        }
      }

      // prefetch history
      api.getHistory
        .query()
        .then(history => dispatch({ type: 'got-history', history }))

      // prefetch rank
      // NOTE: fix call duplication when active bet is already 1 minute old
      api.getRank.query().then(rank => dispatch({ type: 'got-rank', rank }))
    },

    logout: () => {
      localStorage.removeItem('token')
      dispatch({ type: 'logged-out' })
    },

    createBet: async (symbol: string, direction: Direction) => {
      dispatch({ type: 'requested-bet' })

      const bet = await api.createBet.mutate({
        symbol,
        direction,
        userTime: Date.now(),
      })

      dispatch({ type: 'got-bet', bet })
    },

    retrieveBetResult: async (bet: Bet) => {
      const finalBet = await api.retrieveBetResult.mutate({ id: bet.id })
      if (finalBet) {
        dispatch({ type: 'got-result', bet: finalBet })

        // refresh rank
        api.getRank.query().then(rank => dispatch({ type: 'got-rank', rank }))
      }
    },

    closePanel: () => dispatch({ type: 'closed-panel' }),

    selectPanel: (panel: Panel) => {
      if (panel === stateRef.current.panel) {
        dispatch({ type: 'closed-panel' })
        return
      }

      switch (panel) {
        case 'rank': {
          api.getRank.query().then(rank => dispatch({ type: 'got-rank', rank }))
          break
        }
        case 'history': {
          if (stateRef.current.user)
            api.getHistory
              .query()
              .then(history => dispatch({ type: 'got-history', history }))
          break
        }
      }

      dispatch({ type: 'selected-panel', panel })
    },
  })

  useEffect(() => {
    if (localStorage.getItem('token')) {
      ;(async () => {
        // TODO: refactor to a `init` function
        api.getUser.query().then(user => dispatch({ type: 'logged-in', user }))
        const activeBet = await api.getActiveBet.query()

        if (activeBet) {
          dispatch({ type: 'got-bet', bet: activeBet })

          if (+new Date(activeBet.initialTime) + 60 * 1000 < Date.now()) {
            // if activeBet is already 1 minute old, request result
            await command.current.retrieveBetResult(activeBet)
          }
        }

        // prefetch history
        api.getHistory
          .query()
          .then(history => dispatch({ type: 'got-history', history }))

        // prefetch rank
        // NOTE: fix call duplication when active bet is already 1 minute old
        api.getRank.query().then(rank => dispatch({ type: 'got-rank', rank }))
      })()
    }
  }, [])

  return [stateRef.current, command.current] as const
}
