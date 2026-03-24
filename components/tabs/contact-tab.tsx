"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Mail, Phone } from "lucide-react"
import { ContactAutocomplete } from "@/components/contact-autocomplete"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCases, type CaseContact } from "@/contexts/cases-context"
import { useAdmin } from "@/contexts/admin-context"

export function ContactTab() {
  const { currentCase, updateCase } = useCases()
  const { codes } = useAdmin()
  const [contacts, setContacts] = useState<CaseContact[]>(() => {
    return currentCase?.contacts || []
  })

  const [isAddingContact, setIsAddingContact] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [relationship, setRelationship] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)

  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active")
  const [filterCase, setFilterCase] = useState<"all" | "current">("all")

  const filteredContacts = contacts.filter((contact) => {
    // Filter by active status
    if (filterActive === "active" && !contact.isActive) return false
    if (filterActive === "inactive" && contact.isActive) return false

    // Filter by case
    if (filterCase === "current" && contact.caseNumber !== (currentCase?.caseNumber || "12345")) return false

    return true
  })

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact)
  }

  const handleAddContact = () => {
    if (selectedContact && relationship && currentCase) {
      const newContact: CaseContact = {
        id: Date.now().toString(),
        contactId: selectedContact.id,
        name: selectedContact.name,
        email: selectedContact.email,
        phone: selectedContact.phone,
        type: selectedContact.type,
        relationship,
        isPrimary,
        isActive: true,
        caseNumber: currentCase.caseNumber,
      }

      const updatedContacts = [...contacts, newContact]
      setContacts(updatedContacts)

      updateCase(
        currentCase.caseNumber,
        { contacts: updatedContacts },
        {
          action: "added",
          field: "contact",
          newValue: selectedContact.name,
          description: `Added contact: ${selectedContact.name} (${relationship})`,
        },
      )

      // Reset form
      setSelectedContact(null)
      setRelationship("")
      setIsPrimary(false)
      setIsAddingContact(false)
    }
  }

  const handleRemoveContact = (id: string) => {
    const contact = contacts.find((c) => c.id === id)
    const updatedContacts = contacts.filter((c) => c.id !== id)
    setContacts(updatedContacts)

    if (contact && currentCase) {
      updateCase(
        currentCase.caseNumber,
        { contacts: updatedContacts },
        {
          action: "removed",
          field: "contact",
          oldValue: contact.name,
          description: `Removed contact: ${contact.name}`,
        },
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Case Contacts</h3>
        <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Contact to Case</DialogTitle>
              <DialogDescription>Search for a contact and specify their relationship to this case.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Search Contact</Label>
                <ContactAutocomplete onSelect={handleContactSelect} />
                {selectedContact && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="font-medium">{selectedContact.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedContact.type}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedContact.email} • {selectedContact.phone}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship to Case</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="relationship" className="bg-background">
                    <SelectValue placeholder="Select relationship..." />
                  </SelectTrigger>
                  <SelectContent>
                    {codes.contactType
                      .filter((type) => type.active)
                      .map((type) => (
                        <SelectItem key={type.id} value={type.code}>
                          {type.description || type.code}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="primary" className="cursor-pointer">
                  Set as primary contact for this case
                </Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddContact} disabled={!selectedContact || !relationship}>
                  Add Contact
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg">
        <div className="flex gap-2 items-center">
          <Label className="text-sm">Status:</Label>
          <Select value={filterActive} onValueChange={(value: any) => setFilterActive(value)}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Label className="text-sm">Case:</Label>
          <Select value={filterCase} onValueChange={(value: any) => setFilterCase(value)}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              <SelectItem value="current">Current Case Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No contacts added to this case yet.</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead className="w-[100px]">Primary</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.type.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{contact.relationship}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.isPrimary && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        Primary
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
