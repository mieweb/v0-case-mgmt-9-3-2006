"use client"

import { useCases, type ActivityLogEntry } from "@/contexts/cases-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Edit, Plus, Trash2, FileEdit } from "lucide-react"

export function ActivityTab() {
  const { currentCase } = useCases()

  const activityLog = currentCase?.activityLog || []

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
