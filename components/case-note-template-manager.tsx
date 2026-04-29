"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import type { Code } from "@/contexts/admin-context"

interface CaseNoteTemplateManagerProps {
  templates: Code[]
  onAdd: (template: Omit<Code, "id">) => void
  onUpdate: (id: string, updates: Partial<Omit<Code, "id">>) => void
  onDelete: (id: string) => void
}

export function CaseNoteTemplateManager({ templates, onAdd, onUpdate, onDelete }: CaseNoteTemplateManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Code | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [active, setActive] = useState(true)

  const handleOpenDialog = (template?: Code) => {
    if (template) {
      setEditingTemplate(template)
      setCode(template.code)
      setName(template.name || "")
      setDescription(template.description || "")
      setContent(template.content || "")
      setActive(template.active)
    } else {
      setEditingTemplate(null)
      setCode("")
      setName("")
      setDescription("")
      setContent("")
      setActive(true)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingTemplate(null)
    setCode("")
    setName("")
    setDescription("")
    setContent("")
    setActive(true)
  }

  const handleSave = () => {
    if (!code || !name) return

    const templateData = {
      code: code.toLowerCase().replace(/\s+/g, "-"),
      name,
      description,
      content,
      active,
    }

    if (editingTemplate) {
      onUpdate(editingTemplate.id, templateData)
    } else {
      onAdd(templateData)
    }

    handleCloseDialog()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add New Case Note Template</CardTitle>
          <CardDescription>
            Create reusable case note templates for common documentation scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Create Case Note Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Case Note Templates</CardTitle>
          <CardDescription>Manage your case note template library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No case note templates defined yet. Create your first template above.
              </p>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">{template.name}</h3>
                        <Badge variant={template.active ? "default" : "secondary"}>
                          {template.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Code: {template.code}</p>
                      {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenDialog(template)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this template?")) {
                            onDelete(template.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {template.content && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium mb-2">Template Preview:</p>
                      <div
                        className="text-sm text-muted-foreground bg-muted/30 p-3 rounded max-h-32 overflow-y-auto prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            template.content.length > 500
                              ? template.content.substring(0, 500) + "..."
                              : template.content,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Case Note Template" : "Create Case Note Template"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Template Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Initial Call"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-code">Template Code *</Label>
                <Input
                  id="template-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., initial-call"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-active">Status</Label>
                <select
                  id="template-active"
                  value={active ? "active" : "inactive"}
                  onChange={(e) => setActive(e.target.value === "active")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
              />
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <Label>Template Content</Label>
              <RichTextEditor value={content} onChange={setContent} className="min-h-[300px]" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!code || !name}>
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
