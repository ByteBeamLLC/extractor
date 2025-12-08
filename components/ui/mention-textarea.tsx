"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { InputField } from "@/lib/schema"
import { getMentionSuggestions, formatMention, completeMention } from "@/lib/extraction/mentionParser"
import { Upload, FileText, BookOpen } from "lucide-react"

interface BaseOption {
  id: string
  label: string
}

interface KnowledgeOption extends BaseOption {
  type: 'folder' | 'file'
}

export interface MentionTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  // For input document mentions (extraction instructions)
  inputFields?: InputField[]
  onValueChange?: (value: string) => void
  
  // For transformation field mentions (transform builder)
  options?: BaseOption[]
  knowledgeOptions?: KnowledgeOption[]
  onChange?: (value: string) => void
  registerInsertHandler?: (fn: (token: string) => void) => void
}

const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ 
    className, 
    inputFields = [], 
    options = [],
    knowledgeOptions = [],
    value, 
    onChange, 
    onValueChange,
    registerInsertHandler,
    ...props 
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = React.useMemo(() => {
      return (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }
    }, [ref])

    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [suggestions, setSuggestions] = React.useState<Array<{ id: string; label: string; type: 'input' | 'field' | 'knowledge' }>>([])
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [mentionQuery, setMentionQuery] = React.useState("")
    const [mentionStartIndex, setMentionStartIndex] = React.useState(-1)

    const textValue = String(value || "")

    // Determine if we're in input-document mode or transformation mode
    const isInputDocumentMode = inputFields.length > 0 && options.length === 0
    const isTransformMode = options.length > 0 || knowledgeOptions.length > 0

    // Register insert handler for transform mode
    React.useEffect(() => {
      if (registerInsertHandler && textareaRef.current) {
        registerInsertHandler((token: string) => {
          const textarea = textareaRef.current
          if (!textarea) return
          
          const start = textarea.selectionStart || 0
          const end = textarea.selectionEnd || 0
          const newValue = textValue.slice(0, start) + token + textValue.slice(end)
          
          // Update value
          onChange?.(newValue)
          onValueChange?.(newValue)
          
          // Move cursor after inserted token
          requestAnimationFrame(() => {
            if (textarea) {
              const newPos = start + token.length
              textarea.selectionStart = newPos
              textarea.selectionEnd = newPos
              textarea.focus()
            }
          })
        })
      }
    }, [registerInsertHandler, textValue, onChange, onValueChange])

    // Build all suggestions
    const allSuggestions = React.useMemo(() => {
      const result: Array<{ id: string; label: string; type: 'input' | 'field' | 'knowledge' }> = []
      
      // Input document fields
      inputFields.forEach(f => {
        result.push({ id: f.id, label: f.name, type: 'input' })
      })
      
      // Transform field options
      options.forEach(o => {
        result.push({ id: o.id, label: o.label, type: 'field' })
      })
      
      // Knowledge options
      knowledgeOptions.forEach(k => {
        result.push({ id: k.id, label: k.label, type: 'knowledge' })
      })
      
      return result
    }, [inputFields, options, knowledgeOptions])

    // Detect @ and show suggestions
    const checkForMention = React.useCallback((cursorPosition: number) => {
      if (allSuggestions.length === 0) {
        setShowSuggestions(false)
        return
      }

      // Look backward from cursor to find @
      let atIndex = -1
      for (let i = cursorPosition - 1; i >= 0; i--) {
        const char = textValue[i]
        if (char === "@") {
          atIndex = i
          break
        }
        // Stop if we hit whitespace (except space after @)
        if (/[\n\r\t]/.test(char)) {
          break
        }
        // For transform mode, also stop at { or }
        if (isTransformMode && (char === '{' || char === '}')) {
          break
        }
      }

      if (atIndex === -1) {
        setShowSuggestions(false)
        return
      }

      // Check if there's a space or start of string before @
      if (atIndex > 0 && !/[\s\n\r\t{]/.test(textValue[atIndex - 1])) {
        setShowSuggestions(false)
        return
      }

      // Extract query after @
      const query = textValue.slice(atIndex + 1, cursorPosition).replace(/^"/, "").toLowerCase()
      setMentionQuery(query)
      setMentionStartIndex(atIndex)

      // Filter suggestions
      const matches = allSuggestions.filter(s => 
        s.label.toLowerCase().includes(query)
      )
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
      setSelectedIndex(0)
    }, [textValue, allSuggestions, isTransformMode])

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      onChange?.(newValue)
      onValueChange?.(newValue)
      
      // Check for mention after a short delay to get accurate cursor position
      requestAnimationFrame(() => {
        checkForMention(e.target.selectionStart || 0)
      })
    }, [onChange, onValueChange, checkForMention])

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSuggestions) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % suggestions.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case "Enter":
        case "Tab":
          if (suggestions.length > 0) {
            e.preventDefault()
            insertMention(suggestions[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          setShowSuggestions(false)
          break
      }
    }, [showSuggestions, suggestions, selectedIndex])

    const insertMention = React.useCallback((suggestion: { id: string; label: string; type: 'input' | 'field' | 'knowledge' }) => {
      if (!textareaRef.current) return

      const cursorPosition = textareaRef.current.selectionStart || 0
      
      let insertText: string
      if (suggestion.type === 'input') {
        // For input documents, use @Name format
        insertText = suggestion.label.includes(' ') ? `@"${suggestion.label}"` : `@${suggestion.label}`
      } else if (suggestion.type === 'knowledge') {
        // For knowledge, use {kb:Name} format
        insertText = `{kb:${suggestion.label}}`
      } else {
        // For fields, use {Name} format
        insertText = `{${suggestion.label}}`
      }
      
      // Find the @ symbol to replace from
      const before = textValue.slice(0, mentionStartIndex)
      const after = textValue.slice(cursorPosition)
      const newValue = before + insertText + ' ' + after
      
      // Update value
      onChange?.(newValue)
      onValueChange?.(newValue)

      // Move cursor and close suggestions
      setShowSuggestions(false)
      
      // Set cursor position after state update
      const newCursorPosition = mentionStartIndex + insertText.length + 1
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCursorPosition
          textareaRef.current.selectionEnd = newCursorPosition
          textareaRef.current.focus()
        }
      })
    }, [textValue, mentionStartIndex, onChange, onValueChange])

    const handleBlur = React.useCallback(() => {
      // Delay hiding to allow click on suggestion
      setTimeout(() => setShowSuggestions(false), 150)
    }, [])

    const getIcon = (type: 'input' | 'field' | 'knowledge') => {
      switch (type) {
        case 'input':
          return <Upload className="h-4 w-4 text-amber-600" />
        case 'knowledge':
          return <BookOpen className="h-4 w-4 text-emerald-600" />
        default:
          return <FileText className="h-4 w-4 text-blue-600" />
      }
    }

    const getItemClass = (type: 'input' | 'field' | 'knowledge', isSelected: boolean) => {
      const base = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
      if (isSelected) {
        switch (type) {
          case 'input':
            return cn(base, "bg-amber-50 text-amber-900")
          case 'knowledge':
            return cn(base, "bg-emerald-50 text-emerald-900")
          default:
            return cn(base, "bg-blue-50 text-blue-900")
        }
      }
      return cn(base, "hover:bg-slate-50")
    }

    return (
      <div className="relative">
        <textarea
          ref={combinedRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.id}`}
                type="button"
                className={getItemClass(suggestion.type, index === selectedIndex)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(suggestion)
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {getIcon(suggestion.type)}
                <div className="flex-1">
                  <div className="font-medium">
                    {suggestion.type === 'input' 
                      ? (suggestion.label.includes(' ') ? `@"${suggestion.label}"` : `@${suggestion.label}`)
                      : suggestion.type === 'knowledge'
                      ? `{kb:${suggestion.label}}`
                      : `{${suggestion.label}}`
                    }
                  </div>
                </div>
                <span className="text-xs text-slate-400 capitalize">{suggestion.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

MentionTextarea.displayName = "MentionTextarea"

export { MentionTextarea }
