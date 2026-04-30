"use client"

import { useState, useEffect } from "react"
import { CasesDashboard } from "@/components/cases-dashboard"
import { CaseManager } from "@/components/case-manager"
import { CreateCaseWizard } from "@/components/create-case-wizard"
import { AdminPanel } from "@/components/admin-panel"
import { TodoBacklog } from "@/components/todo-backlog"
import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, Plus, Settings, ChevronDown, User, LogOut, Bug, ListTodo } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useEmployees } from "@/contexts/employees-context"
import { Badge } from "@/components/ui/badge"
import { isDebugMode, setDebugMode } from "@/lib/debug"

export default function Page() {
  const [activeView, setActiveView] = useState<"dashboard" | "case" | "create" | "admin" | "backlog">("dashboard")
  const [adminSection, setAdminSection] = useState<string>("work-status-report")
  const { users, currentUser, setCurrentUser } = useUser()
  const { employees } = useEmployees()
  const [debugEnabled, setDebugEnabled] = useState(false)

  useEffect(() => {
    setDebugEnabled(isDebugMode())
  }, [])

  const toggleDebug = () => {
    const newValue = !debugEnabled
    setDebugEnabled(newValue)
    setDebugMode(newValue)
  }

  const openAdminSection = (section: string) => {
    setAdminSection(section)
    setActiveView("admin")
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "case-manager-leader":
        return "default"
      case "case-manager":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="app-container min-h-screen bg-muted/30">
      {/* Navigation Bar */}
      <div className="navbar border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 md:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="navbar-left flex items-center gap-1 sm:gap-2">
              <Button
                variant={activeView === "dashboard" ? "default" : "ghost"}
                onClick={() => setActiveView("dashboard")}
                className="gap-1 sm:gap-2 px-2 sm:px-4"
                size="sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant={activeView === "create" ? "default" : "ghost"}
                onClick={() => setActiveView("create")}
                className="gap-1 sm:gap-2 px-2 sm:px-4"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Case</span>
              </Button>
              <Button
                variant={activeView === "backlog" ? "default" : "ghost"}
                onClick={() => setActiveView("backlog")}
                className="gap-1 sm:gap-2 px-2 sm:px-4"
                size="sm"
              >
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">To Do Backlog</span>
              </Button>
            </div>
            <div className="navbar-right flex items-center gap-1 sm:gap-2">
              <Button
                variant={debugEnabled ? "default" : "ghost"}
                onClick={toggleDebug}
                className="gap-1 sm:gap-2 px-2 sm:px-4"
                size="sm"
                title={debugEnabled ? "Debug Mode ON" : "Debug Mode OFF"}
              >
                <Bug className="h-4 w-4" />
                <span className="hidden lg:inline">Debug</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1 sm:gap-2 px-2 sm:px-4" size="sm">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{currentUser.name}</span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="pii-data">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{currentUser.name}</div>
                      <div className="text-xs text-muted-foreground">{currentUser.email || currentUser.number}</div>
                      {currentUser.role && (
                        <Badge variant={getRoleBadgeVariant(currentUser.role)} className="w-fit mt-1">
                          {currentUser.role}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Switch User (Simulation)
                  </DropdownMenuLabel>
                  {employees
                    .filter((emp) => emp.active && emp.role && emp.id !== currentUser.id)
                    .map((emp) => (
                      <DropdownMenuItem key={emp.id} onClick={() => setCurrentUser(emp)} className="pii-data">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="font-medium">{emp.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{emp.email || emp.number}</span>
                            {emp.role && (
                              <Badge variant={getRoleBadgeVariant(emp.role)} className="text-xs">
                                {emp.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {currentUser.role === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={activeView === "admin" ? "default" : "ghost"}
                      className="gap-1 sm:gap-2 px-2 sm:px-4"
                      size="sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Admin</span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => openAdminSection("users")}>Users</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openAdminSection("case-managers")}>Case Managers</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("case-types")}>Case Types</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("letter-templates")}>
                      Letter Templates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("case-note-templates")}>
                      Case Note Templates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("case-status-codes")}>
                      Case Status Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("case-category-codes")}>
                      Case Category Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("case-closure-reason-codes")}>
                      Case Closure Reason Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("contact-type-codes")}>
                      Contact Type Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("absence-status-codes")}>
                      Absence Status Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("absence-reason-codes")}>
                      Absence Reason Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("restriction-codes")}>
                      Restriction Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("case-activity-codes")}>
                      Case Activity Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAdminSection("document-type-codes")}>
                      Document Type Codes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="main-content">
        {activeView === "dashboard" && <CasesDashboard onViewCase={() => setActiveView("case")} />}
        {activeView === "case" && <CaseManager />}
        {activeView === "create" && <CreateCaseWizard onComplete={() => setActiveView("case")} />}
        {activeView === "admin" && <AdminPanel activeSection={adminSection} />}
        {activeView === "backlog" && (
          <TodoBacklog onBack={() => setActiveView("dashboard")} onViewCase={() => setActiveView("case")} />
        )}
      </div>
    </div>
  )
}
