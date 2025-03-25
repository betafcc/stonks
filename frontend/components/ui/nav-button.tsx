import { createElement, FC } from 'react'
import { Button } from './button'
import { Panel } from '@/hooks/app'

export const NavButton: FC<{
  value: Panel | null
  icon: FC<{ className: string }>
  selected?: Panel | null
  onSelect?: (panel: Panel) => void
}> = ({ value, onSelect, icon, selected }) => (
  <Button
    variant={selected === value ? 'secondary' : 'ghost'}
    size="lg"
    className="flex flex-col py-10 w-full rounded-none cursor-pointer"
    onClick={() => value && onSelect?.(value)}
  >
    {createElement(icon, { className: 'h-5 w-5' })}
    <span className="capitalize">{value}</span>
  </Button>
)
