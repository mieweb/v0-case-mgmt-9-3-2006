"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Square, ExternalLink, X, Save, FileText } from "lucide-react"

interface LetterWindowProps {
  isOpen: boolean
  isMinimized: boolean
  onClose: () => void
  onMinimize: () => void
  onRestore: () => void
  onOpenInNewWindow: () => void
  title: string
  children: React.ReactNode
  onSaveAsTemplate?: () => void
  onCancel?: () => void
  onSaveDraft?: () => void
}

export function LetterWindow({
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  onRestore,
  onOpenInNewWindow,
  title,
  children,
  onSaveAsTemplate,
  onCancel,
  onSaveDraft,
  onSendLetter,
}: LetterWindowProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [size, setSize] = useState({ width: 900, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })

  // Set initial height after mount to access window
  useEffect(() => {
    setSize(prev => ({ ...prev, height: window.innerHeight * 0.85 }))
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: size.width, height: size.height })
    setStartPosition({ x: position.x, y: position.y })
  }, [size, position])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      let newWidth = startSize.width
      let newHeight = startSize.height
      let newX = startPosition.x
      let newY = startPosition.y

      if (resizeDirection?.includes('e')) {
        newWidth = Math.max(600, Math.min(window.innerWidth - position.x - 20, startSize.width + deltaX))
      }
      if (resizeDirection?.includes('w')) {
        const widthChange = Math.min(deltaX, startSize.width - 600)
        newWidth = Math.max(600, startSize.width - deltaX)
        newX = startPosition.x + (startSize.width - newWidth)
      }
      if (resizeDirection?.includes('s')) {
        newHeight = Math.max(400, Math.min(window.innerHeight - position.y - 20, startSize.height + deltaY))
      }
      if (resizeDirection?.includes('n')) {
        newHeight = Math.max(400, startSize.height - deltaY)
        newY = startPosition.y + (startSize.height - newHeight)
      }

      setSize({ width: newWidth, height: newHeight })
      if (resizeDirection?.includes('w') || resizeDirection?.includes('n')) {
        setPosition({ x: newX, y: newY })
      }
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
  }, [isResizing, resizeDirection, startPos, startSize, startPosition, position])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".window-controls")) return
    setIsDragging(true)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  if (!isOpen) return null

  if (isMinimized) return null

  return (
    <div
      className="letter-window fixed bg-card border-2 border-primary shadow-2xl rounded-lg overflow-hidden z-50 flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 40px)",
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

      <div
        className="window-header flex items-center justify-between bg-primary text-primary-foreground px-4 py-2 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="font-semibold">{title}</h3>
        <div className="window-controls flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={onMinimize}
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={onOpenInNewWindow}
            title="Open in New Window"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-destructive text-primary-foreground"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="window-content flex-1 overflow-y-auto">{children}</div>
      <div className="editor-actions bg-card/95 backdrop-blur-sm border-t px-4 py-3 flex justify-between items-center shadow-lg">
        <Button variant="outline" size="sm" onClick={onSaveAsTemplate}>
          <Save className="mr-2 h-4 w-4" />
          Save as Template
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSaveDraft}>
            <FileText className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  )
}

interface MinimizedWindowProps {
  title: string
  onRestore: () => void
  onClose: () => void
}

export function MinimizedWindow({ title, onRestore, onClose }: MinimizedWindowProps) {
  return (
    <div className="minimized-window bg-card border border-border rounded-lg shadow-md px-3 py-2 flex items-center gap-2 min-w-[200px]">
      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onRestore}>
        <Square className="h-3 w-3 mr-1" />
        <span className="text-sm truncate">{title}</span>
      </Button>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto" onClick={onClose}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
