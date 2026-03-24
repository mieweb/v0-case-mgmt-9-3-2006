"use client"

import { useState, useRef, useEffect } from "react"

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Braces, Replace, Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const TEMPLATE_VARIABLES = {
  employee: {
    label: "Employee",
    variables: [
      { label: "First Name", value: "{{employee.firstName}}" },
      { label: "Last Name", value: "{{employee.lastName}}" },
      { label: "Full Name", value: "{{employee.name}}" },
      { label: "Employee Number", value: "{{employee.number}}" },
      { label: "Email", value: "{{employee.email}}" },
      { label: "Phone", value: "{{employee.phone}}" },
      { label: "Location", value: "{{employee.location}}" },
      { label: "Position", value: "{{employee.position}}" },
      { label: "Date of Birth", value: "{{employee.dateOfBirth}}" },
      { label: "Hire Date", value: "{{employee.hireDate}}" },
    ],
  },
  case: {
    label: "Case",
    variables: [
      { label: "Case Number", value: "{{case.caseNumber}}" },
      { label: "Case Type", value: "{{case.caseType}}" },
      { label: "Case Status", value: "{{case.status}}" },
      { label: "Case Manager", value: "{{case.caseManager}}" },
      { label: "Case Adjuster", value: "{{case.adjuster}}" },
      { label: "Adjuster Phone", value: "{{case.adjusterPhone}}" },
      { label: "Adjuster Email", value: "{{case.adjusterEmail}}" },
      { label: "Date of Disability", value: "{{case.dateOfDisability}}" },
      { label: "STD Start Date", value: "{{case.stdStartDate}}" },
      { label: "Expected Return Date", value: "{{case.expectedReturnDate}}" },
    ],
  },
  computed: {
    label: "Computed Values",
    variables: [
      { label: "Age", value: "{{age}}" },
      { label: "Total LWD Days", value: "{{case.totalLwdDays}}" },
      { label: "Total RWD Days", value: "{{case.totalRwdDays}}" },
      { label: "Total FD Days", value: "{{case.totalFdDays}}" },
      { label: "Days Since Disability", value: "{{case.daysSinceDisability}}" },
      { label: "Days Until Return", value: "{{case.daysUntilReturn}}" },
    ],
  },
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
  }, [])

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleInput = () => {
    updateContent()
  }

  const convertToMustache = () => {
    if (editorRef.current) {
      // Replace <<...>> and &lt;&lt;...&gt;&gt; (HTML-encoded) with {{...}}
      let html = editorRef.current.innerHTML
      // Handle HTML-encoded angle brackets first
      html = html.replace(/&lt;&lt;\s*(.*?)\s*&gt;&gt;/g, "{{$1}}")
      // Handle raw angle brackets
      html = html.replace(/<<\s*(.*?)\s*>>/g, "{{$1}}")
      editorRef.current.innerHTML = html
      updateContent()
    }
  }

  // Convert spoken punctuation words to actual punctuation
  const processDictation = (text: string): string => {
    const punctuationMap: Record<string, string> = {
      " comma": ",",
      " period": ".",
      " full stop": ".",
      " question mark": "?",
      " exclamation point": "!",
      " exclamation mark": "!",
      " colon": ":",
      " semicolon": ";",
      " semi colon": ";",
      " dash": " -",
      " hyphen": "-",
      " open parenthesis": " (",
      " close parenthesis": ")",
      " open bracket": " [",
      " close bracket": "]",
      " open quote": ' "',
      " close quote": '"',
      " quote": '"',
      " apostrophe": "'",
      " new line": "\n",
      " newline": "\n",
      " new paragraph": "\n\n",
      " tab": "\t",
    }

    let result = text
    for (const [spoken, punctuation] of Object.entries(punctuationMap)) {
      // Case-insensitive replacement
      const regex = new RegExp(spoken, "gi")
      result = result.replace(regex, punctuation)
    }

    // Capitalize after sentence-ending punctuation
    result = result.replace(/([.!?])\s+([a-z])/g, (_, punct, letter) => `${punct} ${letter.toUpperCase()}`)

    return result
  }

  const toggleDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }

      if (finalTranscript && editorRef.current) {
        // Process punctuation commands
        const processedText = processDictation(finalTranscript)
        
        editorRef.current.focus()
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          const textNode = document.createTextNode(processedText + " ")
          range.insertNode(textNode)
          range.setStartAfter(textNode)
          range.setEndAfter(textNode)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          editorRef.current.innerHTML += processedText + " "
        }
        updateContent()
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" is not a real error - it just means the user hasn't spoken yet
      // "aborted" happens when we manually stop - also not an error
      if (event.error === "no-speech" || event.error === "aborted") {
        return
      }
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      // If still listening (wasn't manually stopped), restart to keep listening
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {
          setIsListening(false)
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      editorRef.current.focus()

      // Special handling for Case Adjuster - insert name, phone, and email together
      let textToInsert = variable
      if (variable === "{{case.adjuster}}") {
        textToInsert = "{{case.adjuster}}, {{case.adjusterPhone}}, {{case.adjusterEmail}}"
      }

      // Insert the variable at cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()

        // Handle newlines by creating proper HTML
        if (textToInsert.includes("\n")) {
          const fragment = document.createDocumentFragment()
          const lines = textToInsert.split("\n")
          lines.forEach((line, index) => {
            fragment.appendChild(document.createTextNode(line))
            if (index < lines.length - 1) {
              fragment.appendChild(document.createElement("br"))
            }
          })
          range.insertNode(fragment)
          // Move cursor to end
          range.collapse(false)
        } else {
          const textNode = document.createTextNode(textToInsert)
          range.insertNode(textNode)
          // Move cursor after inserted text
          range.setStartAfter(textNode)
          range.setEndAfter(textNode)
        }
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Fallback: append at end
        editorRef.current.innerHTML += textToInsert.replace(/\n/g, "<br>")
      }

      updateContent()
    }
  }

  return (
    <div className={cn("rich-text-editor border rounded-lg bg-background flex flex-col overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="toolbar sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("bold")}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("italic")}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("underline")}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertUnorderedList")}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertOrderedList")}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyLeft")}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyCenter")}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyRight")}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Insert Variable">
              <Braces className="h-4 w-4" />
              <span className="text-xs">Variables</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {/* Employee submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>{TEMPLATE_VARIABLES.employee.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                {TEMPLATE_VARIABLES.employee.variables.map((variable) => (
                  <DropdownMenuItem
                    key={variable.value}
                    onClick={() => insertVariable(variable.value)}
                    className="text-sm"
                  >
                    {variable.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Case submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>{TEMPLATE_VARIABLES.case.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                {TEMPLATE_VARIABLES.case.variables.map((variable) => (
                  <DropdownMenuItem
                    key={variable.value}
                    onClick={() => insertVariable(variable.value)}
                    className="text-sm"
                  >
                    {variable.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Computed Values submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>{TEMPLATE_VARIABLES.computed.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                {TEMPLATE_VARIABLES.computed.variables.map((variable) => (
                  <DropdownMenuItem
                    key={variable.value}
                    onClick={() => insertVariable(variable.value)}
                    className="text-sm"
                  >
                    {variable.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={convertToMustache}
          className="h-8 px-2 gap-1"
          title="Convert <<field>> to {{field}} mustache format"
        >
          <Replace className="h-4 w-4" />
          <span className="text-xs">{"<< >> to {{ }}"}</span>
        </Button>

        {speechSupported && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant={isListening ? "destructive" : "ghost"}
              size="sm"
              onClick={toggleDictation}
              className={cn("h-8 px-2 gap-1", isListening && "animate-pulse")}
              title={isListening ? "Stop Dictation" : "Start Dictation"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className="text-xs">{isListening ? "Stop" : "Dictate"}</span>
            </Button>
          </>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "editor-content flex-1 min-h-[250px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none",
          !value && !isFocused && "text-muted-foreground",
        )}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style jsx global>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        .editor-content:focus:before {
          content: none;
        }
      `}</style>
    </div>
  )
}
