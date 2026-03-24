"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HelpCircle, Copy, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdmin } from "@/contexts/admin-context"

interface TodoTemplateBuilderProps {
  onInsert: (template: string) => void
}

export function TodoTemplateBuilder({ onInsert }: TodoTemplateBuilderProps) {
  const { codes } = useAdmin()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [offsetValue, setOffsetValue] = useState("1")
  const [offsetUnit, setOffsetUnit] = useState("Week")
  const [anchor, setAnchor] = useState<string>("caseCreation")
  const [documentType, setDocumentType] = useState<string>("none")
  const [hasRecurrence, setHasRecurrence] = useState(false)
  const [rruleFreq, setRruleFreq] = useState("WEEKLY")
  const [rruleInterval, setRruleInterval] = useState("1")
  const [rruleCount, setRruleCount] = useState("")
  const [copied, setCopied] = useState(false)

  const buildTemplate = () => {
    let template = `"${title}"`

    // Add offset
    if (offsetValue && offsetUnit) {
      template += `; offset=${offsetValue} ${offsetUnit}`
    }

    // Add anchor
    if (anchor) {
      template += `; anchor=${anchor}`
    }

    if (documentType !== "none") {
      template += `; docType=${documentType}`
    }

    // Add recurrence rule
    if (hasRecurrence) {
      let rrule = `FREQ=${rruleFreq}`
      if (rruleInterval) {
        rrule += `;INTERVAL=${rruleInterval}`
      }
      if (rruleCount) {
        rrule += `;COUNT=${rruleCount}`
      }
      template += `; rrule=${rrule}`
    }

    return template
  }

  const handleInsert = () => {
    const template = buildTemplate()
    onInsert(template)
    setOpen(false)
    // Reset form
    setTitle("")
    setOffsetValue("1")
    setOffsetUnit("Week")
    setAnchor("caseCreation")
    setDocumentType("none")
    setHasRecurrence(false)
    setRruleFreq("WEEKLY")
    setRruleInterval("1")
    setRruleCount("")
  }

  const handleCopy = () => {
    const template = buildTemplate()
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Build Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todo Template Builder</DialogTitle>
            <DialogDescription>Build a todo template with offsets, anchors, and recurrence rules</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label>Todo Title *</Label>
              <Input
                placeholder="e.g., Monthly Reassessment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Document Type dropdown */}
            <div className="space-y-2">
              <Label>Document Type (optional)</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="None - no document required" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {codes.documentType
                    .filter((doc) => doc.active)
                    .map((doc) => (
                      <SelectItem key={doc.id} value={doc.code}>
                        {doc.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If selected, completing this todo will require uploading a document or creating a letter of this type
              </p>
            </div>

            {/* Offset */}
            <div className="space-y-2">
              <Label>Offset (when should this todo be due?)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Value"
                  value={offsetValue}
                  onChange={(e) => setOffsetValue(e.target.value)}
                />
                <Select value={offsetUnit} onValueChange={setOffsetUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day(s)</SelectItem>
                    <SelectItem value="Week">Week(s)</SelectItem>
                    <SelectItem value="Month">Month(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Anchor */}
            <div className="space-y-2">
              <Label>Anchor Date (calculate offset from...)</Label>
              <Select value={anchor} onValueChange={setAnchor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select anchor date..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caseCreation">Case Creation (default)</SelectItem>
                  <SelectItem value="surgeryDate">Surgery Date</SelectItem>
                  <SelectItem value="deliveryDate">Delivery Date</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Leave blank to use case creation date</p>
            </div>

            {/* Recurrence */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has-recurrence"
                  checked={hasRecurrence}
                  onChange={(e) => setHasRecurrence(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="has-recurrence">This todo repeats (recurrence rule)</Label>
              </div>

              {hasRecurrence && (
                <div className="pl-6 space-y-3 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={rruleFreq} onValueChange={setRruleFreq}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interval (repeat every X {rruleFreq.toLowerCase()})</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={rruleInterval}
                      onChange={(e) => setRruleInterval(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Count (how many times?) - Optional</Label>
                    <Input
                      type="number"
                      placeholder="Leave blank for infinite"
                      value={rruleCount}
                      onChange={(e) => setRruleCount(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Template Preview</Label>
              <div className="relative">
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">{buildTemplate()}</pre>
                <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInsert} disabled={!title.trim()}>
                Insert Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function TodoTemplateHelp() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <HelpCircle className="h-4 w-4 mr-2" />
        Help
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todo Template Format Guide</DialogTitle>
            <DialogDescription>
              Learn how to write todo templates with offsets, anchors, and recurrence rules
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="offset">Offset</TabsTrigger>
              <TabsTrigger value="anchor">Anchor</TabsTrigger>
              <TabsTrigger value="rrule">Recurrence</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Format</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Todo templates are written one per line with the following format:
                </p>
                <pre className="bg-muted p-3 rounded-md text-sm">
                  "Todo Title"; offset=VALUE UNIT; anchor=DATE; rrule=RULE
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Examples</h3>
                <div className="space-y-2">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <code className="text-sm">"Initial Assessment"; offset=1 Week</code>
                    <p className="text-xs text-muted-foreground mt-1">Simple todo due 1 week after case creation</p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-3">
                    <code className="text-sm">"Post-Surgery Check"; offset=2 Week; anchor=surgeryDate</code>
                    <p className="text-xs text-muted-foreground mt-1">Todo due 2 weeks after surgery date</p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-3">
                    <code className="text-sm">
                      "Monthly Update"; offset=1 Month; rrule=FREQ=MONTHLY;INTERVAL=1;COUNT=6
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">Repeating todo every month, 6 times total</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="offset" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Offset Parameter</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  The offset determines when the todo is due, calculated from the anchor date.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Syntax</h4>
                <pre className="bg-muted p-3 rounded-md text-sm mb-2">offset=VALUE UNIT</pre>
                <p className="text-sm text-muted-foreground">
                  VALUE: A positive number (e.g., 1, 7, 30)
                  <br />
                  UNIT: Day, Week, or Month
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Examples</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">offset=1 Day</code> - Due 1 day after anchor
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">offset=2 Week</code> - Due 2 weeks after anchor
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">offset=6 Month</code> - Due 6 months after anchor
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">offset=0 Week</code> - Due on the same day as anchor
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="anchor" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Anchor Parameter</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  The anchor is the starting date from which the offset is calculated.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Available Anchors</h4>
                <div className="space-y-2">
                  <div className="border rounded p-3">
                    <code className="text-sm font-semibold">caseCreation</code> (default)
                    <p className="text-xs text-muted-foreground mt-1">
                      The date the case was created. This is the default if no anchor is specified.
                    </p>
                  </div>

                  <div className="border rounded p-3">
                    <code className="text-sm font-semibold">surgeryDate</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      A specific surgery date entered for the case. Useful for post-operative follow-ups.
                    </p>
                  </div>

                  <div className="border rounded p-3">
                    <code className="text-sm font-semibold">deliveryDate</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      A specific delivery date for maternity cases. Used for postpartum follow-ups.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Examples</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">"Task"; offset=1 Week</code> - 1 week after case
                    creation
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">"Task"; offset=2 Week; anchor=surgeryDate</code> - 2
                    weeks after surgery
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded">"Task"; offset=6 Week; anchor=deliveryDate</code> - 6
                    weeks after delivery
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="rrule" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Recurrence Rules (RRULE)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Recurrence rules create repeating todos based on iCalendar RRULE standard.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Basic Syntax</h4>
                <pre className="bg-muted p-3 rounded-md text-sm mb-2">rrule=FREQ=frequency;INTERVAL=n;COUNT=total</pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Parameters</h4>
                <div className="space-y-2">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <strong className="text-sm">FREQ</strong> (required)
                    <p className="text-xs text-muted-foreground">Frequency: DAILY, WEEKLY, MONTHLY, or YEARLY</p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-3">
                    <strong className="text-sm">INTERVAL</strong> (optional, default=1)
                    <p className="text-xs text-muted-foreground">
                      Repeat every N intervals (e.g., INTERVAL=2 means every 2 weeks)
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-3">
                    <strong className="text-sm">COUNT</strong> (optional)
                    <p className="text-xs text-muted-foreground">
                      Total number of occurrences. Omit for infinite repetition.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Examples</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <code className="bg-muted px-2 py-1 rounded block mb-1">
                      "Weekly Check"; offset=1 Week; rrule=FREQ=WEEKLY;INTERVAL=1
                    </code>
                    <p className="text-xs text-muted-foreground">Every week starting 1 week after case creation</p>
                  </div>

                  <div>
                    <code className="bg-muted px-2 py-1 rounded block mb-1">
                      "Biweekly Update"; offset=0 Week; rrule=FREQ=WEEKLY;INTERVAL=2;COUNT=12
                    </code>
                    <p className="text-xs text-muted-foreground">Every 2 weeks, 12 times total</p>
                  </div>

                  <div>
                    <code className="bg-muted px-2 py-1 rounded block mb-1">
                      "Monthly Review"; offset=1 Month; rrule=FREQ=MONTHLY;INTERVAL=1;COUNT=17
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Monthly for 17 months starting 1 month after case creation
                    </p>
                  </div>

                  <div>
                    <code className="bg-muted px-2 py-1 rounded block mb-1">
                      "Quarterly Report"; offset=3 Month; rrule=FREQ=MONTHLY;INTERVAL=3
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Every 3 months indefinitely, starting 3 months after case creation
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
