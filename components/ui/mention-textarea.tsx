"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"

type Option = { id: string; label: string }

export function MentionTextarea(props: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
  mentionTrigger?: string // default '@'
  insertWrapper?: (label: string) => string // default: {label}
  className?: string
  registerInsertHandler?: (fn: (token: string) => void) => void
}) {
  const {
    value,
    onChange,
    options,
    placeholder,
    disabled,
    mentionTrigger = "@",
    insertWrapper = (label: string) => `{${label}}`,
    className,
    registerInsertHandler,
  } = props

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [caret, setCaret] = useState(0)
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase()
    if (!q) return options.slice(0, 8)
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 8)
  }, [options, query])

  const updateCaret = () => {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart ?? 0
    setCaret(pos)
    // Determine if we are currently in a mention sequence using the live DOM value
    const before = el.value.slice(0, pos)
    const match = new RegExp(`\\${mentionTrigger}([A-Za-z0-9 _-]{0,50})$`).exec(before)
    if (match) {
      setQuery(match[1])
      setOpen(true)
    } else {
      setQuery(null)
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!registerInsertHandler) return
    const insert = (token: string) => insertAtCaret(token)
    // Register once per handler identity to avoid render loops
    registerInsertHandler(insert)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerInsertHandler])

  const insertAtCaret = (text: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? caret
    const end = el.selectionEnd ?? caret
    const current = el.value
    const newVal = current.slice(0, start) + text + current.slice(end)
    onChange(newVal)
    // Set caret after inserted text on next tick
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + text.length
      el.setSelectionRange(pos, pos)
      setCaret(pos)
    })
  }

  const replaceCurrentMention = (label: string) => {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart ?? caret
    const before = value.slice(0, pos)
    const after = value.slice(pos)
    const re = new RegExp(`(.*)\\${mentionTrigger}([A-Za-z0-9 _-]{0,50})$`)
    const m = re.exec(before)
    if (!m) {
      insertAtCaret(insertWrapper(label))
      return
    }
    const prefix = m[1]
    const replaced = prefix + insertWrapper(label)
    const newVal = replaced + after
    onChange(newVal)
    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      const pos2 = replaced.length
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos2, pos2)
      setCaret(pos2)
    })
    setOpen(false)
    setQuery(null)
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={updateCaret}
        onClick={updateCaret}
        onSelect={updateCaret}
        onFocus={updateCaret}
        placeholder={placeholder}
        className={className || "w-full min-h-24 resize-y rounded-md border border-border bg-background p-2 text-sm"}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-popover shadow-sm">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(e) => {
                e.preventDefault()
                replaceCurrentMention(o.label)
              }}
            >
              @{o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
