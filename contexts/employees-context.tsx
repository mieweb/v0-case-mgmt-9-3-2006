"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type SecurityRole = "admin" | "case-manager" | "case-manager-leader" | "viewer"

export interface Employee {
  id: string
  name: string
  number: string
  location: string
  email?: string
  phone?: string
  role?: SecurityRole
  active: boolean
}

interface EmployeesContextType {
  employees: Employee[]
  addEmployee: (employee: Omit<Employee, "id">) => void
  updateEmployee: (id: string, updates: Partial<Omit<Employee, "id">>) => void
  deleteEmployee: (id: string) => void
  getEmployeeByNumber: (number: string) => Employee | undefined
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined)

const initialEmployees: Employee[] = [
  {
    id: "EMP001",
    name: "Sarah Johnson",
    number: "100234",
    location: "Toledo, OH",
    email: "sarah.j@company.com",
    role: "admin",
    active: true,
  },
  {
    id: "EMP002",
    name: "Michael Chen",
    number: "100567",
    location: "Newark, OH",
    email: "michael.c@company.com",
    role: "case-manager",
    active: true,
  },
  {
    id: "EMP003",
    name: "Jennifer Smith",
    number: "100891",
    location: "Granville, OH",
    email: "jennifer.s@company.com",
    role: "case-manager",
    active: true,
  },
  {
    id: "EMP004",
    name: "David Martinez",
    number: "101024",
    location: "Toledo, OH",
    email: "david.m@company.com",
    role: "viewer",
    active: true,
  },
  {
    id: "EMP005",
    name: "Emily Rodriguez",
    number: "101256",
    location: "Kansas City, KS",
    email: "emily.r@company.com",
    role: "case-manager",
    active: true,
  },
  {
    id: "EMP011",
    name: "Patricia Williams",
    number: "101500",
    location: "Toledo, OH",
    email: "patricia.w@company.com",
    role: "case-manager-leader",
    active: true,
  },
  { id: "EMP006", name: "James Wilson", number: "101489", location: "Fort Worth, TX", active: true },
  { id: "EMP007", name: "Lisa Anderson", number: "101723", location: "Toledo, OH", active: true },
  { id: "EMP008", name: "Robert Taylor", number: "101956", location: "Newark, OH", active: true },
  { id: "EMP009", name: "Jessica Thomas", number: "102189", location: "Granville, OH", active: true },
  { id: "EMP010", name: "Christopher Moore", number: "102412", location: "Kansas City, KS", active: true },
  // Employees with cases (from case data)
  { id: "EMP-12345", name: "John Smith", number: "EMP-12345", location: "Toledo, OH", active: true },
  { id: "EMP-67890", name: "Sarah Johnson", number: "EMP-67890", location: "Newark, OH", active: true },
  { id: "EMP-45678", name: "Michael Davis", number: "EMP-45678", location: "Granville, OH", active: true },
  { id: "EMP-13579", name: "Emily Brown", number: "EMP-13579", location: "Kansas City, KS", active: true },
]

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)

  const addEmployee = (employee: Omit<Employee, "id">) => {
    const newEmployee: Employee = {
      id: `EMP${Date.now()}`,
      ...employee,
    }
    setEmployees((prev) => [...prev, newEmployee])
  }

  const updateEmployee = (id: string, updates: Partial<Omit<Employee, "id">>) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp)))
  }

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id))
  }

  const getEmployeeByNumber = (number: string) => {
    return employees.find((emp) => emp.number === number)
  }

  return (
    <EmployeesContext.Provider
      value={{
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployeeByNumber,
      }}
    >
      {children}
    </EmployeesContext.Provider>
  )
}

export function useEmployees() {
  const context = useContext(EmployeesContext)
  if (context === undefined) {
    throw new Error("useEmployees must be used within an EmployeesProvider")
  }
  return context
}
