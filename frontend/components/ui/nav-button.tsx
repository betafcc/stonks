import { createElement, FC } from 'react'
import { Button } from './button'

export const NavButton: FC<{
  value: string
  icon: FC<{ className: string }>
  selected?: string | null
  onSelect?: (id: string | null) => void
}> = ({ value, onSelect, icon, selected }) => (
  <Button
    variant={selected === value ? 'secondary' : 'ghost'}
    size="lg"
    className="flex flex-col py-10 w-full rounded-none cursor-pointer"
    onClick={() => onSelect?.(value === selected ? null : value)}
  >
    {createElement(icon, { className: 'h-5 w-5' })}
    <span className="capitalize">{value}</span>
  </Button>
)
