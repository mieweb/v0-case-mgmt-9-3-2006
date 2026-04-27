"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus, UserPlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useContacts, type Contact } from "@/contexts/contacts-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContactAutocompleteProps {
  onSelect: (contact: Contact) => void
  className?: string
}

export function ContactAutocomplete({ onSelect, className }: ContactAutocompleteProps) {
  const { contacts, addContact } = useContacts()
  const [value, setValue] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // New contact form state
  const [newContactName, setNewContactName] = useState("")
  const [newContactEmail, setNewContactEmail] = useState("")
  const [newContactPhone, setNewContactPhone] = useState("")
  const [newContactType, setNewContactType] = useState<string>("")

  useEffect(() => {
    if (value.length > 0) {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(value.toLowerCase()) ||
          contact.email.toLowerCase().includes(value.toLowerCase()) ||
          contact.type.some((t) => t.toLowerCase().includes(value.toLowerCase())) ||
          (contact.employeeNumber && contact.employeeNumber.includes(value)),
      )
      setFilteredContacts(filtered)
      setShowResults(true)
    } else {
      setFilteredContacts([])
      setShowResults(false)
    }
  }, [value, contacts])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (contact: Contact) => {
    setValue("")
    setShowResults(false)
    onSelect(contact)
  }

  const handleAddNewContact = () => {
    if (newContactName && newContactEmail && newContactType) {
      const contactId = addContact({
        name: newContactName,
        email: newContactEmail,
        phone: newContactPhone,
        type: [newContactType],
        isEmployee: false,
      })

      // Find the newly added contact and select it
      const newContact = contacts.find((c) => c.id === contactId) || {
        id: contactId,
        name: newContactName,
        email: newContactEmail,
        phone: newContactPhone,
        type: newContactTypes,
        isEmployee: false,
      }

      onSelect(newContact as Contact)

      // Reset form
      setNewContactName("")
      setNewContactEmail("")
      setNewContactPhone("")
      setNewContactType("")
      setShowAddDialog(false)
      setValue("")
    }
  }

  const availableTypes = [
    "Physician",
    "Medical Specialist",
    "Supervisor",
    "HR Representative",
    "Attorney",
    "External Case Manager",
    "Family Member",
    "Emergency Contact",
    "Other",
  ]

  return (
    <>
      <div className={cn("relative", className)}>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search contacts by name, email, or type..."
          className="bg-background"
          autoComplete="new-password"
          name="search-case-contacts-field"
          data-lpignore="true"
          data-form-type="other"
        />
        {showResults && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-auto"
          >
            {filteredContacts.length > 0 ? (
              <>
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelect(contact)}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b"
                  >
                    <div className="font-medium flex items-center gap-2">
                      {contact.name}
                      {contact.isEmployee && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Employee</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contact.type.map((t, idx) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {contact.email} • {contact.phone}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setNewContactName(value)
                    setShowAddDialog(true)
                    setShowResults(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-t bg-muted/50 flex items-center gap-2 font-medium text-primary"
                >
                  <UserPlus className="h-4 w-4" />
                  Create new contact "{value}"
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setNewContactName(value)
                  setShowAddDialog(true)
                  setShowResults(false)
                }}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <div>
                  <div className="font-medium">No contacts found</div>
                  <div className="text-sm text-muted-foreground">Click to add "{value}" as a new contact</div>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>Create a new non-employee contact to add to the case.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name *</Label>
              <Input
                id="new-name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email *</Label>
              <Input
                id="new-email"
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-phone">Phone Number</Label>
              <Input
                id="new-phone"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-type">Contact Type *</Label>
              <Select value={newContactType} onValueChange={setNewContactType}>
                <SelectTrigger id="contact-type" className="bg-background">
                  <SelectValue placeholder="Select contact type..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddNewContact}
                disabled={!newContactName || !newContactEmail || !newContactType}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
