"use client"

import type { ReactNode } from "react"
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
  if (!isOpen || isMinimized) return null

  return (
    <div className="note-window fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="window-container bg-card rounded-lg shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
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
