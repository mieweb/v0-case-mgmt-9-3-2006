"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Pencil, Trash2, X, Check, Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdmin } from "@/contexts/admin-context"
import { useCases, type Document } from "@/contexts/cases-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function DocumentsTab() {
  const { codes } = useAdmin()
  const { currentCase, updateCase } = useCases()
  
  // Form state
  const [documentType, setDocumentType] = useState("")
  const [receivedFrom, setReceivedFrom] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ documentType: "", receivedFrom: "", description: "" })
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  
  // Get documents from current case
  const documents = currentCase?.documents || []
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Read file as data URL for storage and viewing
      const reader = new FileReader()
      reader.onload = (event) => {
        setFileDataUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const resetForm = () => {
    setDocumentType("")
    setReceivedFrom("")
    setDescription("")
    setSelectedFile(null)
    setFileDataUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  const handleUpload = () => {
    if (!currentCase || !documentType) return
    
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      caseNumber: currentCase.caseNumber,
      dateReceived: new Date().toISOString().split("T")[0],
      documentType,
      receivedFrom,
      description,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      fileDataUrl: fileDataUrl || undefined,
    }
    
    const updatedDocuments = [...documents, newDocument]
    
    updateCase(
      currentCase.caseNumber,
      { documents: updatedDocuments },
      {
        action: "added",
        field: "document",
        newValue: documentType,
        description: `Uploaded document: ${description || documentType}`,
      }
    )
    
    resetForm()
  }
  
  const handleEdit = (doc: Document) => {
    setEditingId(doc.id)
    setEditData({
      documentType: doc.documentType,
      receivedFrom: doc.receivedFrom,
      description: doc.description,
    })
  }
  
  const handleSaveEdit = () => {
    if (!currentCase || !editingId) return
    
    const updatedDocuments = documents.map((doc) =>
      doc.id === editingId
        ? { ...doc, ...editData }
        : doc
    )
    
    updateCase(
      currentCase.caseNumber,
      { documents: updatedDocuments },
      {
        action: "updated",
        field: "document",
        newValue: editData.documentType,
        description: `Updated document: ${editData.description || editData.documentType}`,
      }
    )
    
    setEditingId(null)
  }
  
  const handleCancelEdit = () => {
    setEditingId(null)
  }
  
  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc)
    setDeleteDialogOpen(true)
  }
  
  const handleConfirmDelete = () => {
    if (!currentCase || !documentToDelete) return
    
    const updatedDocuments = documents.filter((doc) => doc.id !== documentToDelete.id)
    
    updateCase(
      currentCase.caseNumber,
      { documents: updatedDocuments },
      {
        action: "deleted",
        field: "document",
        oldValue: documentToDelete.documentType,
        description: `Deleted document: ${documentToDelete.description || documentToDelete.documentType}`,
      }
    )
    
    setDeleteDialogOpen(false)
    setDocumentToDelete(null)
  }
  
  const getDocumentTypeName = (code: string) => {
    const docType = codes.documentType.find((t) => t.code === code)
    return docType?.description || docType?.code || code
  }
  
  const handleViewDocument = async (doc: Document) => {
    if (doc.fileDataUrl) {
      const isWordDoc = doc.fileDataUrl.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml') ||
                        doc.fileDataUrl.startsWith('data:application/msword') ||
                        doc.fileName?.endsWith('.docx') ||
                        doc.fileName?.endsWith('.doc')
      
      if (isWordDoc && doc.fileDataUrl.includes('base64,')) {
        // Convert Word document to HTML using mammoth
        try {
          const mammoth = await import('mammoth')
          const base64Data = doc.fileDataUrl.split('base64,')[1]
          const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer
          const result = await mammoth.convertToHtml({ arrayBuffer })
          
          const newWindow = window.open()
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${doc.fileName || 'Document'}</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                    img { max-width: 100%; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid #ddd; padding: 8px; }
                  </style>
                </head>
                <body>${result.value}</body>
              </html>
            `)
            newWindow.document.close()
          }
        } catch (error) {
          console.error('Error converting Word document:', error)
          // Fallback to download
          const link = document.createElement('a')
          link.href = doc.fileDataUrl
          link.download = doc.fileName || 'document'
          link.click()
        }
      } else {
        // Open the file in a new tab for images and PDFs
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${doc.fileName || 'Document'}</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                ${doc.fileDataUrl.startsWith('data:image/') 
                  ? `<img src="${doc.fileDataUrl}" style="max-width:100%;max-height:100vh;" />`
                  : doc.fileDataUrl.startsWith('data:application/pdf')
                    ? `<iframe src="${doc.fileDataUrl}" style="width:100%;height:100vh;border:none;"></iframe>`
                    : `<a href="${doc.fileDataUrl}" download="${doc.fileName || 'document'}" style="padding:20px;background:#007bff;color:white;text-decoration:none;border-radius:8px;font-family:sans-serif;">Download ${doc.fileName || 'Document'}</a>`
                }
              </body>
            </html>
          `)
          newWindow.document.close()
        }
      }
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Documents</h3>
        <div className="text-sm text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? "s" : ""} for this case
        </div>
      </div>

      {/* Upload Form */}
      <div className="border rounded-lg p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-4 w-4" />
          <span className="font-medium">Upload New Document</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="doc-type" className="text-sm text-muted-foreground">
              Document Type *
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="doc-type" className="bg-background">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent className="max-h-80 overflow-y-auto">
                {codes.documentType
                  .filter((type) => type.active)
                  .map((type) => (
                    <SelectItem key={type.id} value={type.code}>
                      {type.description || type.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="received-from" className="text-sm text-muted-foreground">
              Received From
            </Label>
            <Input 
              id="received-from" 
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="Received from..." 
              className="bg-background" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              File
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </span>
              <input 
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-muted-foreground">
              Description
            </Label>
            <Input 
              id="description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Document description..." 
              className="bg-background" 
            />
          </div>
          <Button 
            onClick={handleUpload}
            disabled={!documentType}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No documents uploaded
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.dateReceived}</TableCell>
                  <TableCell>
                    {editingId === doc.id ? (
                      <Select 
                        value={editData.documentType} 
                        onValueChange={(v) => setEditData({ ...editData, documentType: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {codes.documentType
                            .filter((type) => type.active)
                            .map((type) => (
                              <SelectItem key={type.id} value={type.code}>
                                {type.description || type.code}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getDocumentTypeName(doc.documentType)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === doc.id ? (
                      <Input
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      doc.description || "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === doc.id ? (
                      <Input
                        value={editData.receivedFrom}
                        onChange={(e) => setEditData({ ...editData, receivedFrom: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      doc.receivedFrom || "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.fileName ? (
                      <div className="flex items-center gap-1 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[120px]" title={doc.fileName}>
                          {doc.fileName}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === doc.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {doc.fileDataUrl && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDocument(doc)} title="View document">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(doc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(doc)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {documentToDelete && (
              <div className="bg-muted rounded-md p-3">
                <div className="font-medium">{getDocumentTypeName(documentToDelete.documentType)}</div>
                <div className="text-sm text-muted-foreground">{documentToDelete.description || "No description"}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
