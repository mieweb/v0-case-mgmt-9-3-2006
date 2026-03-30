"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [hasUserToggled, setHasUserToggled] = React.useState(false)

  // Sync with defaultOpen when it changes (e.g., when data loads), but only if user hasn't manually toggled
  React.useEffect(() => {
    if (!hasUserToggled) {
      setIsOpen(defaultOpen)
    }
  }, [defaultOpen, hasUserToggled])

  const handleOpenChange = (open: boolean) => {
    setHasUserToggled(true)
    setIsOpen(open)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className={cn("w-full", className)}>
      <Card className="py-0 gap-0">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-t-xl"
          >
            <div className="flex items-center gap-2">
              {icon && (
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              <span className="text-sm font-semibold text-foreground">{title}</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
