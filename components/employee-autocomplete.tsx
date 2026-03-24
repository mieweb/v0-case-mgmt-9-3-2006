"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from 'lucide-react'
import { cn } from "@/lib/utils"

// Sample employee data - in production this would come from an API/HRIS
const SAMPLE_EMPLOYEES = [
  { id: "EMP001", name: "Sarah Johnson", number: "100234", location: "Toledo, OH" },
  { id: "EMP002", name: "Michael Chen", number: "100567", location: "Newark, OH" },
  { id: "EMP003", name: "Jennifer Smith", number: "100891", location: "Granville, OH" },
  { id: "EMP004", name: "David Martinez", number: "101024", location: "Toledo, OH" },
  { id: "EMP005", name: "Emily Rodriguez", number: "101256", location: "Kansas City, KS" },
  { id: "EMP006", name: "James Wilson", number: "101489", location: "Fort Worth, TX" },
  { id: "EMP007", name: "Lisa Anderson", number: "101723", location: "Toledo, OH" },
  { id: "EMP008", name: "Robert Taylor", number: "101956", location: "Newark, OH" },
  { id: "EMP009", name: "Jessica Thomas", number: "102189", location: "Granville, OH" },
  { id: "EMP010", name: "Christopher Moore", number: "102412", location: "Kansas City, KS" },
]

interface Employee {
  id: string
  name: string
  number: string
  location: string
}

interface EmployeeAutocompleteProps {
  onSelect?: (employee: Employee) => void
  placeholder?: string
  className?: string
}

export function EmployeeAutocomplete({ 
  onSelect, 
  placeholder = "Start typing name or ID...",
  className 
}: EmployeeAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter employees based on input
  useEffect(() => {
    if (value.length === 0) {
      setFilteredEmployees([])
      setOpen(false)
      return
    }

    const searchTerm = value.toLowerCase()
    const filtered = SAMPLE_EMPLOYEES.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.number.includes(searchTerm) ||
        emp.id.toLowerCase().includes(searchTerm)
    )

    setFilteredEmployees(filtered)
    setOpen(filtered.length > 0)
  }, [value])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    setValue(employee.name)
    setOpen(false)
    onSelect?.(employee)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (!e.target.value) {
      setSelectedEmployee(null)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="bg-background"
        onFocus={() => {
          if (filteredEmployees.length > 0) {
            setOpen(true)
          }
        }}
      />
      
      {open && filteredEmployees.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md"
        >
          <Command>
            <CommandList>
              <CommandEmpty>No employees found.</CommandEmpty>
              <CommandGroup>
                {filteredEmployees.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={employee.id}
                    onSelect={() => handleSelect(employee)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{employee.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {employee.number} • {employee.location}
                        </span>
                      </div>
                      {selectedEmployee?.id === employee.id && (
                        <Check className="h-4 w-4 ml-2" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
