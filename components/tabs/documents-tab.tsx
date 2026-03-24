"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload, FileText } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdmin } from "@/contexts/admin-context"

export function DocumentsTab() {
  const { codes } = useAdmin()
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Documents</h3>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="doc-date" className="text-sm text-muted-foreground">
            Date Received
          </Label>
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
            Auto-generated
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc-type" className="text-sm text-muted-foreground">
            Document Type
          </Label>
          <Select>
            <SelectTrigger id="doc-type" className="bg-background">
              <SelectValue placeholder="Select type..." />
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
          <Input id="received-from" placeholder="Enter source..." className="bg-background" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm text-muted-foreground">
          Description
        </Label>
        <Input id="description" placeholder="Document description..." className="bg-background" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground">No documents uploaded</TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
