'use client'

import { useTimer } from '@/hooks/time'
import { cn } from '@/lib/utils'
import { ComponentProps, FC } from 'react'

type HookParams = Parameters<typeof useTimer>[0]

export const Timer: FC<
  HookParams & Omit<ComponentProps<typeof TimerView>, 'left'>
> = ({ duration, updateInterval, onTimeout, ...props }) => {
  const [left] = useTimer({ duration, updateInterval, onTimeout })

  return <TimerView duration={duration} left={left} {...props} />
}

export const TimerView: FC<
  { duration: number; left: number } & Omit<
    ComponentProps<'div'>,
    'duration' | 'left'
  >
> = ({ duration, left, className, ...props }) => {
  const progress = 1 - left / duration
  const seconds = Math.floor(left / 1000)
  const tenths = Math.floor((left % 1000) / 100)
  const formattedTime = `${seconds < 10 ? '0' : ''}${seconds}.${tenths}`

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className,
      )}
      {...props}
    >
      <svg width="100%" height="100%" viewBox="0 0 120 120" className="absolute">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="blue"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 54}
          strokeDashoffset={2 * Math.PI * 54 * (1 - progress)}
          transform="rotate(-90 60 60)"
          className="text-primary transition-all duration-100 ease-linear"
        />
      </svg>

      <div className="text-center font-mono">
        <span className="text-3xl font-bold">
          {formattedTime.split('.')[0]}
        </span>
        <span className="text-xl font-bold">
          .{formattedTime.split('.')[1]}
        </span>
      </div>
    </div>
  )
}
