import { useEffect, useReducer, useRef } from 'react'

export type User = {
  id: number
  email: string
  name: string
  score: number
  picture: string
}

export type Direction = 'up' | 'down'

export type Bet = {
  id: number
  symbol: string
  direction: Direction
  initial: number
  initialTime: number
  final: number | null
  finalTime: number | null
}

export type Panel = 'profile' | 'history' | 'rank'

export type GameState =
  | { type: 'idle' }
  | { type: 'waiting-bet' }
  | { type: 'waiting-result'; bet: Bet }

export type State = {
  user?: User
  panel?: Panel
  game: GameState
  symbol: string
  history: Bet[]
  rank: User[]
}

export const initial: State = {
  game: { type: 'idle' },
  symbol: 'BTCUSDT',
  history: [],
  rank: [],
}

export type Event =
  | { type: 'logged-in'; user: User }
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
    case 'requested-bet':
      return { ...state, game: { type: 'waiting-bet' } }
    case 'got-bet':
      return { ...state, game: { type: 'waiting-result', bet: event.bet } }
    case 'got-result':
      return {
        ...state,
        game: { type: 'idle' },
        history: [...state.history, event.bet],
      }
    case 'got-history':
      return { ...state, history: event.history }
    case 'got-rank':
      return { ...state, rank: event.rank }
    case 'closed-panel':
      return { ...state, panel: undefined }
    case 'selected-panel':
      return { ...state, panel: event.panel }
  }
}

export type Api = {
  createBet: {
    mutate: (input: {
      symbol: string
      direction: Direction
      timestamp: number
    }) => Promise<Bet>
  }

  getRank: {
    query: () => Promise<User[]>
  }

  getHistory: {
    query: (userId: number) => Promise<Bet[]>
  }

  getLastBet: {
    query: (userId: number) => Promise<Bet>
  }
}

export const makeUseApp = (api: Api) => (initialState?: Partial<State>) => {
  const [state, dispatch] = useReducer(reducer, { ...initial, ...initialState })
  const stateRef = useRef(state)
  // rerender avoiding evil trick
  stateRef.current = state
  const command = useRef({
    login: (user: User) => {
      // prefetch history
      api.getHistory
        .query(user.id)
        .then(history => dispatch({ type: 'got-history', history }))

      api.getLastBet.query(user.id).then(bet => {
        // check if last bet still open
        if (bet && bet.final === null) dispatch({ type: 'got-bet', bet })
        dispatch({ type: 'logged-in', user })
      })
    },
    createBet: async (symbol: string, direction: Direction) => {
      dispatch({ type: 'requested-bet' })

      const bet = await api.createBet.mutate({
        symbol,
        direction,
        timestamp: Date.now(),
      })

      dispatch({ type: 'got-bet', bet })
    },

    closePanel: () => dispatch({ type: 'closed-panel' }),
    selectPanel: (panel: Panel) => {
      switch (panel) {
        case 'rank': {
          api.getRank.query().then(rank => dispatch({ type: 'got-rank', rank }))
          break
        }
        case 'history': {
          if (stateRef.current.user)
            api.getHistory
              .query(stateRef.current.user.id)
              .then(history => dispatch({ type: 'got-history', history }))
          break
        }
      }
      dispatch({ type: 'selected-panel', panel })
    },
  })

  useEffect(() => {
    api.getRank.query().then(rank => {
      dispatch({ type: 'got-rank', rank })
    })
  }, [])

  return [stateRef.current, command.current] as const
}
