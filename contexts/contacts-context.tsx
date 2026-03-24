"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { debug } from "@/lib/debug"

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  type: string[]
  // Additional fields for non-employee contacts
  isEmployee?: boolean
  employeeNumber?: string
  location?: string
}

interface ContactsContextType {
  contacts: Contact[]
  addContact: (contact: Omit<Contact, "id">) => string
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  getAllContacts: () => Contact[]
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

// Initial contacts - includes both employees and external contacts
const initialContacts: Contact[] = [
  // External contacts
  {
    id: "C001",
    name: "Dr. Sarah Williams",
    email: "swilliams@clinic.com",
    phone: "(555) 123-4567",
    type: ["Physician"],
    isEmployee: false,
  },
  {
    id: "C002",
    name: "James Anderson",
    email: "janderson@company.com",
    phone: "(555) 234-5678",
    type: ["Supervisor"],
    isEmployee: false,
  },
  {
    id: "C003",
    name: "Maria Garcia",
    email: "mgarcia@hr.company.com",
    phone: "(555) 345-6789",
    type: ["HR Representative"],
    isEmployee: false,
  },
  {
    id: "C004",
    name: "Dr. Michael Chen",
    email: "mchen@hospital.com",
    phone: "(555) 456-7890",
    type: ["Physician", "Medical Specialist"],
    isEmployee: false,
  },
  {
    id: "C005",
    name: "Lisa Thompson",
    email: "lthompson@company.com",
    phone: "(555) 567-8901",
    type: ["Supervisor"],
    isEmployee: false,
  },
  {
    id: "C006",
    name: "Robert Miller",
    email: "rmiller@law.com",
    phone: "(555) 678-9012",
    type: ["Attorney"],
    isEmployee: false,
  },
  {
    id: "C007",
    name: "Dr. Emily Davis",
    email: "edavis@clinic.com",
    phone: "(555) 789-0123",
    type: ["Physician"],
    isEmployee: false,
  },
  {
    id: "C008",
    name: "Jennifer Martinez",
    email: "jmartinez@company.com",
    phone: "(555) 890-1234",
    type: ["HR Representative"],
    isEmployee: false,
  },
  // Employees as contacts
  {
    id: "EMP001",
    name: "Sarah Johnson",
    email: "sjohnson@company.com",
    phone: "(740) 555-0234",
    type: ["Employee"],
    isEmployee: true,
    employeeNumber: "100234",
    location: "Newark, OH",
  },
  {
    id: "EMP002",
    name: "Michael Chen",
    email: "mchen@company.com",
    phone: "(419) 555-0567",
    type: ["Employee"],
    isEmployee: true,
    employeeNumber: "100567",
    location: "Toledo, OH",
  },
  {
    id: "EMP003",
    name: "Jennifer Smith",
    email: "jsmith@company.com",
    phone: "(740) 555-0891",
    type: ["Employee"],
    isEmployee: true,
    employeeNumber: "100891",
    location: "Granville, OH",
  },
]

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)

  const addContact = (contact: Omit<Contact, "id">): string => {
    const newId = contact.isEmployee ? `EMP${Date.now().toString().slice(-6)}` : `C${Date.now().toString().slice(-3)}`

    const newContact: Contact = {
      ...contact,
      id: newId,
    }

    setContacts((prev) => [...prev, newContact])
    debug("New contact added:", newContact)
    return newId
  }

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    debug("Contact updated:", id, updates)
  }

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    debug("Contact deleted:", id)
  }

  const getAllContacts = () => contacts

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        addContact,
        updateContact,
        deleteContact,
        getAllContacts,
      }}
    >
      {children}
    </ContactsContext.Provider>
  )
}

export function useContacts() {
  const context = useContext(ContactsContext)
  if (context === undefined) {
    throw new Error("useContacts must be used within a ContactsProvider")
  }
  return context
}
