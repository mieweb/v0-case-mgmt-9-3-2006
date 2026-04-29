"use client"

import { useCases, type ActivityLogEntry } from "@/contexts/cases-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Edit, Plus, Trash2, FileEdit, Shield } from "lucide-react"

export function ActivityTab() {
  const { currentCase } = useCases()

  const activityLog = currentCase?.activityLog || []
  const adaTracking = currentCase?.adaTracking || []

  // Helper to get ADA status for a given date
  const getADAStatusForDate = (timestamp: string) => {
    const entryDate = new Date(timestamp)
    // Find the most recent ADA status on or before this date
    const relevantADA = adaTracking
      .filter((ada) => new Date(ada.date) <= entryDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    return relevantADA?.status || null
  }

  const getADAStatusColor = (status: string | null) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Denied":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "Review Due":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      case "Closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
      default:
        return ""
    }
  }

  // Sort by timestamp descending (most recent first)
  const sortedLog = [...activityLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getActionIcon = (action: ActivityLogEntry["action"]) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4" />
      case "updated":
        return <Edit className="h-4 w-4" />
      case "added":
        return <Plus className="h-4 w-4" />
      case "removed":
        return <Trash2 className="h-4 w-4" />
      default:
        return <FileEdit className="h-4 w-4" />
    }
  }

  const getActionColor = (action: ActivityLogEntry["action"]) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-800"
      case "updated":
        return "bg-blue-100 text-blue-800"
      case "added":
        return "bg-green-100 text-green-800"
      case "removed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="activity-tab space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Activity Log</h3>
          <p className="text-sm text-muted-foreground">Chronological record of all case actions</p>
        </div>
        <div className="text-sm text-muted-foreground">{activityLog.length} total entries</div>
      </div>

      {sortedLog.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No activity recorded yet</p>
        </div>
      ) : (
        <ScrollArea className="activity-log-list h-[600px] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[180px]">Date & Time</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
                <TableHead className="w-[100px]">ADA Status</TableHead>
                <TableHead className="w-[150px]">User</TableHead>
                <TableHead className="w-[150px]">Field</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLog.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm font-mono">{formatTimestamp(entry.timestamp)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`gap-1 ${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)}
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getADAStatusForDate(entry.timestamp) ? (
                      <Badge variant="outline" className={`gap-1 ${getADAStatusColor(getADAStatusForDate(entry.timestamp))}`}>
                        <Shield className="h-3 w-3" />
                        {getADAStatusForDate(entry.timestamp)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{entry.userName}</TableCell>
                  <TableCell className="text-sm font-mono">{entry.field}</TableCell>
                  <TableCell className="text-sm">{entry.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  )
}
