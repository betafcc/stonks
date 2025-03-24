'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

export const useTime = (intervalMs: number = 1000) => {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date())
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs])

  return time
}

export const useTimer = ({
  duration,
  updateInterval = 100,
  onTimeout,
}: {
  duration: number
  updateInterval?: number
  onTimeout?: () => void
}) => {
  const [msLeft, setMsLeft] = useState(duration)

  const durationRef = useRef(duration)
  const startTimeRef = useRef(Date.now())
  const intervalRef = useRef<number>(null)

  const updateTimer = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current
    const remaining = Math.max(0, durationRef.current - elapsed)
    setMsLeft(remaining)

    if (remaining === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      onTimeout?.()
    }
  }, [onTimeout])

  useEffect(() => {
    intervalRef.current = +setInterval(updateTimer, updateInterval)

    updateTimer()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [updateInterval, updateTimer])

  const setDurationValue = useCallback((newDuration: number) => {
    durationRef.current = newDuration
    startTimeRef.current = Date.now()
    setMsLeft(newDuration)
  }, [])

  return [msLeft, setDurationValue] as const
}
