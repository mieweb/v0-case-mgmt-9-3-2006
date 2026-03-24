"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from 'lucide-react'

export function QuestionnairesTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Questionnaires — DAR (Disability Action Request)</h3>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create DAR
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="response-date" className="text-sm text-muted-foreground">
            Date of Response
          </Label>
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
            Auto-generated
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">DAR Actions</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="dar-task" />
            <label
              htmlFor="dar-task"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Set DAR Task
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="dar-letter" />
            <label
              htmlFor="dar-letter"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Send Letter
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="dar-invoice" />
            <label
              htmlFor="dar-invoice"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Create Invoice
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="dar-attachment" />
            <label
              htmlFor="dar-attachment"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Add Attachment
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="dar-ltd" />
            <label
              htmlFor="dar-ltd"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              LTD App Submission
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dar-notes" className="text-sm text-muted-foreground">
          Notes
        </Label>
        <Input id="dar-notes" placeholder="Additional notes..." className="bg-background" />
      </div>
    </div>
  )
}
