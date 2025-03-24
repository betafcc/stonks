import { createElement, FC } from 'react'
import { Button } from './button'
import { Panel } from '@/hooks/app'

export const NavButton: FC<{
  value: Panel
  icon: FC<{ className: string }>
  selected?: Panel
  onSelect?: (id?: Panel) => void
}> = ({ value, onSelect, icon, selected }) => (
  <Button
    variant={selected === value ? 'secondary' : 'ghost'}
    size="lg"
    className="flex flex-col py-10 w-full rounded-none cursor-pointer"
    onClick={() => onSelect?.(value === selected ? undefined : value)}
  >
    {createElement(icon, { className: 'h-5 w-5' })}
    <span className="capitalize">{value}</span>
  </Button>
)
