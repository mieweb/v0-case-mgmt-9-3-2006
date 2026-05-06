"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Mail, Phone, History, Check } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

export function ContactTab() {
  const { currentCase, updateCase, cases } = useCases()
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

  // Import from previous cases state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedPreviousCase, setSelectedPreviousCase] = useState<string>("")
  const [selectedContactsToImport, setSelectedContactsToImport] = useState<string[]>([])

  // Get previous cases for the same employee (excluding current case)
  const previousCases = cases.filter(
    (c) => c.employeeNumber === currentCase?.employeeNumber && c.caseNumber !== currentCase?.caseNumber
  )

  // Get contacts from the selected previous case
  const previousCaseContacts = selectedPreviousCase
    ? cases.find((c) => c.caseNumber === selectedPreviousCase)?.contacts || []
    : []

  const handleToggleContactToImport = (contactId: string) => {
    setSelectedContactsToImport((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  const handleImportContacts = () => {
    if (!currentCase || selectedContactsToImport.length === 0) return

    const contactsToImport = previousCaseContacts.filter((c) => selectedContactsToImport.includes(c.id))
    const newContacts: CaseContact[] = contactsToImport.map((contact) => ({
      ...contact,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      caseNumber: currentCase.caseNumber,
    }))

    const updatedContacts = [...contacts, ...newContacts]
    setContacts(updatedContacts)

    updateCase(
      currentCase.caseNumber,
      { contacts: updatedContacts },
      {
        action: "added",
        field: "contacts",
        newValue: `${newContacts.length} contacts`,
        description: `Imported ${newContacts.length} contact(s) from case ${selectedPreviousCase}`,
      }
    )

    // Reset and close dialog
    setSelectedContactsToImport([])
    setSelectedPreviousCase("")
    setIsImportDialogOpen(false)
  }

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
        <div className="flex gap-2">
          {/* Import from Previous Cases Button */}
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
            setIsImportDialogOpen(open)
            if (!open) {
              setSelectedPreviousCase("")
              setSelectedContactsToImport([])
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <History className="mr-2 h-4 w-4" />
                Import from Previous Case
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Import Contacts from Previous Cases</DialogTitle>
                <DialogDescription>
                  Select a previous case to import contacts from. These contacts will be added to the current case.
                </DialogDescription>
              </DialogHeader>
              
              {previousCases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No previous cases found for this employee.
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Previous Case</Label>
                    <Select value={selectedPreviousCase} onValueChange={(value) => {
                      setSelectedPreviousCase(value)
                      setSelectedContactsToImport([])
                    }}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a case..." />
                      </SelectTrigger>
                      <SelectContent>
                        {previousCases.map((c) => (
                          <SelectItem key={c.caseNumber} value={c.caseNumber}>
                            {c.caseNumber} - {c.caseType} ({c.contacts?.length || 0} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPreviousCase && previousCaseContacts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Contacts to Import</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedContactsToImport.length === previousCaseContacts.length) {
                              setSelectedContactsToImport([])
                            } else {
                              setSelectedContactsToImport(previousCaseContacts.map((c) => c.id))
                            }
                          }}
                        >
                          {selectedContactsToImport.length === previousCaseContacts.length ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      <div className="border rounded-md max-h-64 overflow-y-auto">
                        {previousCaseContacts.map((contact) => {
                          const isAlreadyAdded = contacts.some(
                            (c) => c.contactId === contact.contactId && c.relationship === contact.relationship
                          )
                          return (
                            <div
                              key={contact.id}
                              className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                                isAlreadyAdded ? "opacity-50 bg-muted/30" : "hover:bg-muted/50"
                              }`}
                            >
                              <Checkbox
                                checked={selectedContactsToImport.includes(contact.id)}
                                onCheckedChange={() => handleToggleContactToImport(contact.id)}
                                disabled={isAlreadyAdded}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {contact.relationship} • {contact.email}
                                </div>
                              </div>
                              {isAlreadyAdded && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  Already added
                                </span>
                              )}
                              {contact.isPrimary && !isAlreadyAdded && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  Primary
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {selectedPreviousCase && previousCaseContacts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No contacts found in the selected case.
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportContacts}
                      disabled={selectedContactsToImport.length === 0}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Import {selectedContactsToImport.length > 0 ? `(${selectedContactsToImport.length})` : ""} Contacts
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Add Contact Button */}
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
      </div>

      <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg">
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
