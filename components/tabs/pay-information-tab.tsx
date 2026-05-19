"use client"

import { useState, useEffect } from "react"
import { DollarSign } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCases } from "@/contexts/cases-context"

export function PayInformationTab() {
  const { currentCase, updateCase } = useCases()

  // FICA Date State
  const [ficaDate, setFicaDate] = useState("")

  // Calculate FICA date (date of disability + 6 months + first day of next month)
  const calculateFicaDate = (dateOfDisability: string): string => {
    if (!dateOfDisability) return ""
    
    const disabilityDate = new Date(dateOfDisability + "T00:00:00")
    if (isNaN(disabilityDate.getTime())) {
      return ""
    }
    
    // Add 6 months
    disabilityDate.setMonth(disabilityDate.getMonth() + 6)
    
    // Move to first day of next month
    disabilityDate.setMonth(disabilityDate.getMonth() + 1)
    disabilityDate.setDate(1)
    
    return disabilityDate.toISOString().split("T")[0]
  }

  // Load data from case
  useEffect(() => {
    if (currentCase) {
      setFicaDate(currentCase.ficaDate || "")
      
      // Calculate FICA date if we have date of disability
      if (currentCase.dateOfDisability) {
        const calculatedFica = calculateFicaDate(currentCase.dateOfDisability)
        if (calculatedFica && calculatedFica !== currentCase.ficaDate) {
          setFicaDate(calculatedFica)
          updateCase(currentCase.caseNumber, { ficaDate: calculatedFica })
        }
      }
    }
  }, [currentCase?.caseNumber, currentCase?.dateOfDisability])

  return (
    <div className="space-y-6">
      {/* FICA Date Info */}
      {ficaDate ? (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>FICA Date</AlertTitle>
          <AlertDescription>
            Auto-calculated FICA Date: <strong>{new Date(ficaDate + "T00:00:00").toLocaleDateString()}</strong>
            <span className="text-muted-foreground ml-2">(Date of disability + 6 months + first day of next month)</span>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>FICA Date</AlertTitle>
          <AlertDescription>
            No FICA date available. Set a Date of Disability in the Case tab to auto-calculate the FICA date.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
