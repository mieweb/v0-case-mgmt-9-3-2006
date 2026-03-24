"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Square, ExternalLink, X, Save, FileText, Send } from "lucide-react"

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
  onSendLetter?: () => void
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
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

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
        width: "900px",
        maxWidth: "90vw",
        height: "85vh",
      }}
    >
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
          <Button variant="outline" size="sm" onClick={onSaveDraft}>
            <FileText className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button size="sm" onClick={onSendLetter}>
            <Send className="mr-2 h-4 w-4" />
            Send Letter
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
