"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from 'lucide-react'
import { cn } from "@/lib/utils"

// Sample employee data - in production this would come from an API/HRIS
const SAMPLE_EMPLOYEES = [
  { id: "EMP001", name: "Sarah Johnson", number: "100234", location: "Toledo, OH", dob: "1985-03-15", ssnLast4: "1234" },
  { id: "EMP002", name: "Michael Chen", number: "100567", location: "Newark, OH", dob: "1990-07-22", ssnLast4: "5678" },
  { id: "EMP003", name: "Jennifer Smith", number: "100891", location: "Granville, OH", dob: "1988-11-08", ssnLast4: "9012" },
  { id: "EMP004", name: "David Martinez", number: "101024", location: "Toledo, OH", dob: "1982-01-30", ssnLast4: "3456" },
  { id: "EMP005", name: "Emily Rodriguez", number: "101256", location: "Kansas City, KS", dob: "1995-05-12", ssnLast4: "7890" },
  { id: "EMP006", name: "James Wilson", number: "101489", location: "Fort Worth, TX", dob: "1978-09-25", ssnLast4: "2345" },
  { id: "EMP007", name: "Lisa Anderson", number: "101723", location: "Toledo, OH", dob: "1992-04-18", ssnLast4: "6789" },
  { id: "EMP008", name: "Robert Taylor", number: "101956", location: "Newark, OH", dob: "1987-12-03", ssnLast4: "0123" },
  { id: "EMP009", name: "Jessica Thomas", number: "102189", location: "Granville, OH", dob: "1993-08-27", ssnLast4: "4567" },
  { id: "EMP010", name: "Christopher Moore", number: "102412", location: "Kansas City, KS", dob: "1980-06-14", ssnLast4: "8901" },
]

interface Employee {
  id: string
  name: string
  number: string
  location: string
  dob: string
  ssnLast4: string
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
    // Format DOB search term to match YYYY-MM-DD format
    const dobSearchTerm = searchTerm.replace(/\//g, "-")
    const filtered = SAMPLE_EMPLOYEES.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.number.includes(searchTerm) ||
        emp.id.toLowerCase().includes(searchTerm) ||
        emp.dob.includes(dobSearchTerm) ||
        emp.ssnLast4.includes(searchTerm)
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
                        <span className="text-xs text-muted-foreground">
                          DOB: {employee.dob} • SSN: ***-**-{employee.ssnLast4}
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
