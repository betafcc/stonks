import { ComponentProps, FC } from 'react'
import { History, User, Medal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { NavButton } from './nav-button'

export const NavBar: FC<
  {
    selected: ComponentProps<typeof NavButton>['selected']
    onSelect: ComponentProps<typeof NavButton>['onSelect']
  } & Omit<ComponentProps<'nav'>, 'selected' | 'onSelect'>
> = ({ selected, onSelect, className, ...props }) => (
  <nav
    className={cn(
      'flex w-20 flex-col items-center border-r bg-muted/40 py-0',
      className,
    )}
    {...props}
  >
    <NavButton
      value="profile"
      selected={selected}
      icon={User}
      onSelect={onSelect}
    />
    <NavButton
      value="history"
      selected={selected}
      icon={History}
      onSelect={onSelect}
    />
    <NavButton
      value="rank"
      selected={selected}
      icon={Medal}
      onSelect={onSelect}
    />
  </nav>
)
