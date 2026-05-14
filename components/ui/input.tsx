import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, onKeyDown, onChange, ...props }: React.ComponentProps<'input'>) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If 't' or 'T' is pressed on a date or datetime-local field, enter today's date
    if ((type === 'date' || type === 'datetime-local') && (e.key === 't' || e.key === 'T')) {
      e.preventDefault()
      const today = new Date()
      let value: string
      
      if (type === 'date') {
        value = today.toISOString().split('T')[0]
      } else {
        // datetime-local format: YYYY-MM-DDTHH:MM
        value = today.toISOString().slice(0, 16)
      }
      
      // Create a synthetic event to trigger onChange
      const syntheticEvent = {
        target: { value },
        currentTarget: { value },
      } as React.ChangeEvent<HTMLInputElement>
      
      // Update the input value
      e.currentTarget.value = value
      
      // Call the onChange handler if provided
      if (onChange) {
        onChange(syntheticEvent)
      }
    }
    
    // Call the original onKeyDown handler if provided
    if (onKeyDown) {
      onKeyDown(e)
    }
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      onKeyDown={handleKeyDown}
      onChange={onChange}
      {...props}
    />
  )
}

export { Input }
