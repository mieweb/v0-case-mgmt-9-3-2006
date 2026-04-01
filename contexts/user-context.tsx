"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Employee } from "./employees-context"

export type SecurityRole = "admin" | "case-manager" | "case-manager-leader" | "viewer"

export interface User {
  id: string
  name: string
  email: string
  role: SecurityRole
  active: boolean
}

interface UserContextType {
  users: User[]
  currentUser: Employee
  setCurrentUser: (user: Employee) => void
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, updates: Partial<Omit<User, "id">>) => void
  deleteUser: (id: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const initialUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@company.com", role: "admin", active: true },
  { id: "2", name: "John Smith", email: "john.smith@company.com", role: "case-manager", active: true },
  { id: "3", name: "Sarah Johnson", email: "sarah.johnson@company.com", role: "case-manager", active: true },
  { id: "4", name: "Mike Davis", email: "mike.davis@company.com", role: "viewer", active: true },
  { id: "5", name: "Ikenna Amanfo", email: "ikenna.amanfo@company.com", role: "case-manager", active: true },
  { id: "6", name: "Tricia Fletcher", email: "tricia.fletcher@company.com", role: "case-manager", active: true },
]

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [currentUser, setCurrentUser] = useState<Employee>({
    id: "EMP001",
    name: "Sarah Johnson",
    number: "100234",
    location: "Toledo, OH",
    email: "sarah.j@company.com",
    role: "admin",
    active: true,
  })

  const addUser = (user: Omit<User, "id">) => {
    const newUser: User = {
      id: Date.now().toString(),
      ...user,
    }
    setUsers((prev) => [...prev, newUser])
  }

  const updateUser = (id: string, updates: Partial<Omit<User, "id">>) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...updates } : user)))
    // Update current user if it's the one being updated
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }))
    }
  }

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id))
  }

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
