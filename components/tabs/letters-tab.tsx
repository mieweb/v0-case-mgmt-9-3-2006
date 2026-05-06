"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, List, LayoutList } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useCases, type TodoItem } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"
import { useEmployees } from "@/contexts/employees-context"
import { LetterWindow, MinimizedWindow } from "@/components/letter-window"
import { evaluateMustacheTemplate } from "@/lib/mustache-parser"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Letter {
  id: string
  caseNumber: string
  letterType: string
  template: string
  sentFrom: string
  content: string
  createdDate: string
  sentDate?: string
  status: "Draft" | "Sent"
}

export function LettersTab() {
  const { currentCase, updateCase } = useCases()
  const { codes, addCode, caseManagers } = useAdmin()
  const { employees } = useEmployees()
  const letterTemplates = codes.letterTemplates

  // Find a Case Manager Leader to assign the todo
  const getCaseManagerLeader = () => {
    const leader = employees.find(emp => emp.role === "case-manager-leader" && emp.active)
    return leader?.name || "Case Manager Leader"
  }
  const [letters, setLetters] = useState<Letter[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "detail">("list")

  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateCode, setTemplateCode] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")

  const [sentFrom, setSentFrom] = useState(currentCase?.caseManager || "")
  
  const [template, setTemplate] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    if (currentCase?.caseNumber) {
      const savedLetters = localStorage.getItem(`letters-${currentCase.caseNumber}`)
      if (savedLetters) {
        setLetters(JSON.parse(savedLetters))
      } else {
        setLetters([])
      }
    }
  }, [currentCase?.caseNumber])

  useEffect(() => {
    if (currentCase?.caseNumber && letters.length > 0) {
      localStorage.setItem(`letters-${currentCase.caseNumber}`, JSON.stringify(letters))
    }
  }, [letters, currentCase?.caseNumber])

  const handleCreateLetter = () => {
    setEditingLetter(null)
    setSentFrom(currentCase?.caseManager || "")
    
    setTemplate("")
    setContent("")
    setIsDialogOpen(true)
    setIsMinimized(false)
  }

  const handleEditLetter = (letter: Letter) => {
    setEditingLetter(letter)
    setSentFrom(letter.sentFrom)
    
    setTemplate(letter.template)
    setContent(letter.content)
    setIsDialogOpen(true)
    setIsMinimized(false)
  }

  const handleSaveDraftAction = () => {
    if (!currentCase) return

    const now = new Date().toISOString()
    // Evaluate mustache variables in the content before saving
    const evaluatedContent = evaluateMustacheTemplate(content, currentCase)
    const templateName = letterTemplates?.find((t) => t.code === template)?.name || template || "Draft"

    if (editingLetter) {
      setLetters((prev) =>
        prev.map((l) => (l.id === editingLetter.id ? { ...l, sentFrom, letterType: templateName, template, content: evaluatedContent } : l)),
      )
      updateCase(
        currentCase.caseNumber,
        {},
        {
          action: "updated",
          field: "letter",
          oldValue: editingLetter.letterType,
          newValue: templateName,
          description: `Updated letter: ${templateName}`,
        },
      )
    } else {
      const letterId = `letter-${Date.now()}`
      const newLetter: Letter = {
        id: letterId,
        caseNumber: currentCase.caseNumber,
        letterType: templateName,
        template,
        sentFrom,
        content: evaluatedContent,
        createdDate: now,
        status: "Draft",
      }
      setLetters((prev) => [...prev, newLetter])
      
      // Create a TODO for a Case Manager Leader to complete the letter (linked to the letter)
      const newTodo: TodoItem = {
        id: `todo-letter-${Date.now()}`,
        activity: `Complete draft letter: ${templateName}`,
        caseManager: getCaseManagerLeader(),
        dateScheduled: new Date().toISOString().split("T")[0],
        completed: false,
        linkedLetterId: letterId,
      }
      const updatedTodos = [...(currentCase.todos || []), newTodo]
      
      updateCase(
        currentCase.caseNumber,
        { todos: updatedTodos },
        {
          action: "added",
          field: "letter",
          newValue: templateName,
          description: `Added draft letter: ${templateName} (TODO assigned to Case Manager Leader)`,
        },
      )
    }

    setIsDialogOpen(false)
  }

  const handleSendLetterAction = () => {
    if (!currentCase) return

    const now = new Date().toISOString()
    // Evaluate mustache variables in the content before sending
    const evaluatedContent = evaluateMustacheTemplate(content, currentCase)
    const templateName = letterTemplates?.find((t) => t.code === template)?.name || template || "Letter"

    if (editingLetter) {
      setLetters((prev) =>
        prev.map((l) =>
          l.id === editingLetter.id
            ? { ...l, sentFrom, letterType: templateName, template, content: evaluatedContent, status: "Sent" as const, sentDate: now }
            : l,
        ),
      )
      updateCase(
        currentCase.caseNumber,
        {},
        {
          action: "updated",
          field: "letter",
          oldValue: "Draft",
          newValue: "Sent",
          description: `Sent letter: ${templateName}`,
        },
      )
    } else {
      const newLetter: Letter = {
        id: `letter-${Date.now()}`,
        caseNumber: currentCase.caseNumber,
        letterType: templateName,
        template,
        sentFrom,
        content: evaluatedContent,
        createdDate: now,
        sentDate: now,
        status: "Sent",
      }
      setLetters((prev) => [...prev, newLetter])
      updateCase(
        currentCase.caseNumber,
        {},
        {
          action: "added",
          field: "letter",
          newValue: templateName,
          description: `Created and sent letter: ${templateName}`,
        },
      )
    }

    setIsDialogOpen(false)
  }

  const handleDeleteLetter = (id: string) => {
    const letter = letters.find((l) => l.id === id)
    setLetters((prev) => prev.filter((l) => l.id !== id))
    if (letter && currentCase) {
      updateCase(
        currentCase.caseNumber,
        {},
        {
          action: "removed",
          field: "letter",
          oldValue: letter.letterType,
          description: `Deleted letter: ${letter.letterType || "Untitled"}`,
        },
      )
    }
  }

  const handleOpenInNewWindow = () => {
    const newWindow = window.open("", "_blank", "width=900,height=700")
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${editingLetter ? "Edit Letter" : "Create Letter"}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
              .form-group { margin-bottom: 15px; }
              label { display: block; margin-bottom: 5px; font-weight: 500; }
              input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
              textarea { min-height: 400px; font-family: inherit; }
              .button-group { display: flex; gap: 10px; margin-top: 20px; }
              button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
              .btn-primary { background: #0070f3; color: white; }
              .btn-secondary { background: #666; color: white; }
            </style>
          </head>
          <body>
            <h2>${editingLetter ? "Edit Letter" : "Create Letter"}</h2>
            <div class="form-group">
              <label>Letter Sent From</label>
              <input type="text" value="${sentFrom}" />
            </div>
            <div class="form-group">
              <label>Letter Type</label>
              <select>
                <option value="">Select letter type...</option>
                <option value="initial">Initial Contact Letter</option>
                <option value="followup">Follow-up Letter</option>
                <option value="closure">Case Closure Letter</option>
                <option value="rtw">Return to Work Letter</option>
                <option value="medical">Medical Documentation Request</option>
                <option value="benefits">Benefits Information</option>
              </select>
            </div>
            <div class="form-group">
              <label>Letter Content</label>
              <textarea>${content}</textarea>
            </div>
            <div class="button-group">
              <button class="btn-secondary" onclick="window.close()">Close</button>
              <button class="btn-primary">Save Draft</button>
              <button class="btn-primary">Send Letter</button>
            </div>
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  const handleTemplateChange = (templateCode: string) => {
    setTemplate(templateCode)

    if (currentCase && templateCode) {
      const selectedTemplate = letterTemplates?.find((t) => t.code === templateCode)
      if (selectedTemplate?.content) {
        const evaluatedContent = evaluateMustacheTemplate(selectedTemplate.content, currentCase)
        // Convert plain text with newlines to HTML paragraphs for the rich text editor
        const htmlContent = evaluatedContent
          .split('\n\n')
          .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
          .join('')
        setContent(htmlContent)
      }
    }
  }

  const handleSaveAsTemplate = () => {
    setIsSaveTemplateDialogOpen(true)
    setTemplateName("")
    setTemplateCode("")
    setTemplateDescription("")
  }

  const handleConfirmSaveTemplate = () => {
    if (!templateName || !templateCode) return

    addCode("letterTemplates", {
      code: templateCode.toLowerCase().replace(/\s+/g, "-"),
      name: templateName,
      description: templateDescription,
      active: true,
      content: content, // Save the current content as the template
    })

    setIsSaveTemplateDialogOpen(false)
    setTemplateName("")
    setTemplateCode("")
    setTemplateDescription("")
  }

  return (
    <div className="letters-tab space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Letters</h3>
          <p className="text-sm text-muted-foreground">
            {letters.length} letter{letters.length !== 1 ? "s" : ""} for this case
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "detail" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("detail")}
              className="rounded-l-none"
            >
              <LayoutList className="h-4 w-4 mr-1" />
              Detail
            </Button>
          </div>
          <Button size="sm" onClick={handleCreateLetter}>
            <Plus className="mr-2 h-4 w-4" />
            Create Letter
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="letters-list border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {letters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No letters created yet. Click "Create Letter" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                letters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell>{new Date(letter.createdDate).toLocaleDateString()}</TableCell>
                    <TableCell>{letter.template || "—"}</TableCell>
                    <TableCell className="pii-data">{letter.sentFrom}</TableCell>
                    <TableCell>
                      <Badge variant={letter.status === "Sent" ? "default" : "secondary"}>{letter.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditLetter(letter)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLetter(letter.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="letters-detail-view space-y-4">
          {letters.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              No letters created yet. Click "Create Letter" to get started.
            </div>
          ) : (
            letters.map((letter) => (
              <div key={letter.id} className="letter-detail-item border rounded-lg overflow-hidden">
                {/* Letter header row */}
                <div className="letter-header bg-muted/30 p-4 flex items-center justify-between border-b">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Date</div>
                      <div className="font-medium">{new Date(letter.createdDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Template</div>
                      <div>{letter.template || "—"}</div>
                    </div>
                    <div className="pii-data">
                      <div className="text-xs text-muted-foreground mb-1">From</div>
                      <div>{letter.sentFrom}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Status</div>
                      <Badge variant={letter.status === "Sent" ? "default" : "secondary"}>{letter.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditLetter(letter)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteLetter(letter.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                {/* Letter content */}
                <div className="letter-content p-6 bg-background phi-data">
                  <div className="text-xs text-muted-foreground mb-2 font-medium">LETTER CONTENT</div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: letter.content || "<p class='text-muted-foreground italic'>No content</p>",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <LetterWindow
        isOpen={isDialogOpen}
        isMinimized={isMinimized}
        onClose={() => setIsDialogOpen(false)}
        onMinimize={() => setIsMinimized(true)}
        onRestore={() => setIsMinimized(false)}
        onOpenInNewWindow={handleOpenInNewWindow}
        title={editingLetter ? "Edit Letter" : "Create Letter"}
        onSaveAsTemplate={handleSaveAsTemplate}
        onCancel={() => setIsDialogOpen(false)}
        onSaveDraft={handleSaveDraftAction}
        onSendLetter={handleSendLetterAction}
      >
        <div className="letter-form space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="letter-from" className="text-xs">
                Letter Sent From
              </Label>
              <Select value={sentFrom} onValueChange={setSentFrom}>
                <SelectTrigger id="letter-from" className="bg-background h-8 text-sm">
                  <SelectValue placeholder="Select case manager..." />
                </SelectTrigger>
                <SelectContent>
                  {caseManagers
                    .filter((cm) => cm.active)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cm) => (
                      <SelectItem key={cm.id} value={cm.name}>
                        {cm.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="letter-template" className="text-xs">
                Letter Template
              </Label>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger id="letter-template" className="bg-background h-8 text-sm">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {letterTemplates && letterTemplates.length > 0 ? (
                    letterTemplates
                      .filter((t) => t.active)
                      .map((t) => (
                        <SelectItem key={t.code} value={t.code}>
                          {t.name || t.code}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No templates available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Letter Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Type your letter content here or select a template..."
              className="phi-data"
            />
          </div>
        </div>
      </LetterWindow>

      <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this letter as a reusable template. Use Mustache tags like {`{{employeeName}}`} in your content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Welcome Letter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-code">Template Code</Label>
              <Input
                id="template-code"
                value={templateCode}
                onChange={(e) => setTemplateCode(e.target.value)}
                placeholder="e.g., welcome-letter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Input
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSaveTemplate} disabled={!templateName || !templateCode}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isMinimized && (
        <div className="fixed bottom-4 left-4 z-40">
          <MinimizedWindow
            title={editingLetter ? "Edit Letter" : "Create Letter"}
            onRestore={() => setIsMinimized(false)}
            onClose={() => {
              setIsMinimized(false)
              setIsDialogOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
