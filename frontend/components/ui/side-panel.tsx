import { ComponentProps, FC } from 'react'
import { X } from 'lucide-react'

import { Button } from './button'
import { Panel } from '@/hooks/app'
import { cn } from '@/lib/utils'

// NOTE: setting pane as fixed and with defined position to avoid live-chart autoSize bug
// https://github.com/tradingview/lightweight-charts/issues/1724
// TODO: use css vars to keep header/footer size in sync
export const SidePanel: FC<
  {
    selected?: Panel | null
    onClose?: () => void
  } & Omit<ComponentProps<'div'>, 'selected' | 'onClose'>
> = ({ selected, onClose, className, ...props }) =>
  selected && (
    <div
      className={cn('w-64 border-r z-80 bg-primary-foreground', className)}
      {...props}
    >
      <div className="flex h-12 items-center justify-between border-b px-4">
        <h2 className="font-medium capitalize">{selected}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This is the content section.
          </p>
          <p className="text-sm text-muted-foreground">
            You can add more content here specific to this section.
          </p>
        </div>
      </div>
    </div>
  )
