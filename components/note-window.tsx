"use client"

import type { ReactNode } from "react"
import { useState, useEffect, useCallback } from "react"
import { X, Minimize2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NoteWindowProps {
  isOpen: boolean
  isMinimized: boolean
  onClose: () => void
  onMinimize: () => void
  onRestore: () => void
  onOpenInNewWindow: () => void
  title: string
  children: ReactNode
  onCancel: () => void
  onSaveNote: () => void
}

export function NoteWindow({
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  onOpenInNewWindow,
  title,
  children,
  onCancel,
  onSaveNote,
}: NoteWindowProps) {
  const [size, setSize] = useState({ width: 1024, height: 600 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: size.width, height: size.height })
  }, [size])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      let newWidth = startSize.width
      let newHeight = startSize.height

      if (resizeDirection?.includes('e')) {
        newWidth = Math.max(600, Math.min(window.innerWidth - 40, startSize.width + deltaX))
      }
      if (resizeDirection?.includes('w')) {
        newWidth = Math.max(600, Math.min(window.innerWidth - 40, startSize.width - deltaX))
      }
      if (resizeDirection?.includes('s')) {
        newHeight = Math.max(400, Math.min(window.innerHeight - 40, startSize.height + deltaY))
      }
      if (resizeDirection?.includes('n')) {
        newHeight = Math.max(400, Math.min(window.innerHeight - 40, startSize.height - deltaY))
      }

      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeDirection(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeDirection, startPos, startSize])

  if (!isOpen || isMinimized) return null

  return (
    <div className="note-window fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="window-container bg-card rounded-lg shadow-2xl flex flex-col relative"
        style={{ 
          width: `${size.width}px`, 
          height: `${size.height}px`,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)'
        }}
      >
        {/* Resize handles */}
        <div 
          className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize z-10" 
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        />
        <div 
          className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize z-10" 
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
        <div 
          className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize z-10" 
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        />
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10 hover:bg-muted/50 rounded-tl" 
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        >
          <svg className="w-4 h-4 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
        <div 
          className="absolute top-0 left-2 right-2 h-1 cursor-n-resize" 
          onMouseDown={(e) => handleResizeStart(e, 'n')}
        />
        <div 
          className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize" 
          onMouseDown={(e) => handleResizeStart(e, 's')}
        />
        <div 
          className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize" 
          onMouseDown={(e) => handleResizeStart(e, 'w')}
        />
        <div 
          className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize" 
          onMouseDown={(e) => handleResizeStart(e, 'e')}
        />

        {/* Window header */}
        <div className="window-header bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary-foreground/20" onClick={onMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary-foreground/20"
              onClick={onOpenInNewWindow}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary-foreground/20" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Window content - scrollable */}
        <div className="window-content flex-1 overflow-y-auto">{children}</div>

        {/* Fixed action buttons at bottom */}
        <div className="window-actions border-t px-6 py-4 flex justify-end items-center gap-3 bg-card rounded-b-lg">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSaveNote}>Save Note</Button>
        </div>
      </div>
    </div>
  )
}

export function MinimizedNoteWindow({
  title,
  onRestore,
  onClose,
}: {
  title: string
  onRestore: () => void
  onClose: () => void
}) {
  return (
    <div className="minimized-window bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
      <button onClick={onRestore} className="hover:underline font-medium">
        {title}
      </button>
      <button onClick={onClose} className="hover:bg-primary-foreground/20 rounded p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
