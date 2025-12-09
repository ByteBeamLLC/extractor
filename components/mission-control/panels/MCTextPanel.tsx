"use client"

import React, { useEffect, useMemo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Quote, Strikethrough, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MCTextPanelProps {
    value: string | number | boolean
    onChange: (value: string | number | boolean) => void
}

const isLikelyHtml = (value: string) => /<([a-z][\s\S]*?)>/i.test(value)

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

const textToHtmlWithBreaks = (value: string) =>
    value
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(Boolean)
        .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
        .join('') || '<p></p>'

const markdownToHtml = (markdown: string) =>
    renderToStaticMarkup(
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    )

const toolbarButton = (opts: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <Button
        type="button"
        size="sm"
        variant={opts.active ? 'secondary' : 'ghost'}
        className="h-8 w-8 p-0 flex items-center justify-center"
        onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            opts.onClick()
        }}
        aria-label={opts.label}
    >
        {opts.icon}
    </Button>
)

export function MCTextPanel({ value, onChange }: MCTextPanelProps) {
    const initialContent = useMemo(() => {
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') return value
        return String(value)
    }, [value])

    const normalizedContent = useMemo(() => {
        if (!initialContent) return ''
        const trimmed = initialContent.trim()
        if (!trimmed) return ''

        if (isLikelyHtml(trimmed)) return trimmed

        try {
            return markdownToHtml(trimmed)
        } catch (error) {
            console.error('Failed to parse markdown, falling back to plain text:', error)
            return textToHtmlWithBreaks(trimmed)
        }
    }, [initialContent])

    const editor = useEditor({
        content: normalizedContent,
        extensions: [
            StarterKit.configure({
                history: true,
                codeBlock: false,
            }),
            Placeholder.configure({
                placeholder: 'Write notes, decisions, or paste text. Use / for quick commands.',
            }),
        ],
        editorProps: {
            attributes: {
                class:
                    'prose prose-sm max-w-none dark:prose-invert focus:outline-none px-2 py-2 rounded-md min-h-[160px] cursor-text',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            onChange(html)
        },
    })

    useEffect(() => {
        if (!editor) return
        const current = editor.getHTML()
        if (normalizedContent !== current) {
            editor.commands.setContent(normalizedContent || '', false)
        }
    }, [normalizedContent, editor])

    if (!editor) {
        return <div className="text-sm text-muted-foreground">Loading editor…</div>
    }

    return (
        <div className="relative border border-slate-200 rounded-lg bg-white shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-100 bg-slate-50">
                {toolbarButton({
                    active: editor.isActive('bold'),
                    onClick: () => editor.chain().focus().toggleBold().run(),
                    icon: <Bold className="h-4 w-4" />,
                    label: 'Bold',
                })}
                {toolbarButton({
                    active: editor.isActive('italic'),
                    onClick: () => editor.chain().focus().toggleItalic().run(),
                    icon: <Italic className="h-4 w-4" />,
                    label: 'Italic',
                })}
                {toolbarButton({
                    active: editor.isActive('strike'),
                    onClick: () => editor.chain().focus().toggleStrike().run(),
                    icon: <Strikethrough className="h-4 w-4" />,
                    label: 'Strike',
                })}
                <div className="h-5 w-px bg-slate-200 mx-1" />
                {toolbarButton({
                    active: editor.isActive('bulletList'),
                    onClick: () => editor.chain().focus().toggleBulletList().run(),
                    icon: <List className="h-4 w-4" />,
                    label: 'Bullet list',
                })}
                {toolbarButton({
                    active: editor.isActive('orderedList'),
                    onClick: () => editor.chain().focus().toggleOrderedList().run(),
                    icon: <ListOrdered className="h-4 w-4" />,
                    label: 'Numbered list',
                })}
                {toolbarButton({
                    active: editor.isActive('blockquote'),
                    onClick: () => editor.chain().focus().toggleBlockquote().run(),
                    icon: <Quote className="h-4 w-4" />,
                    label: 'Quote',
                })}
                {toolbarButton({
                    active: false,
                    onClick: () => editor.chain().focus().setHorizontalRule().run(),
                    icon: <Minus className="h-4 w-4" />,
                    label: 'Divider',
                })}
            </div>

            <div className="p-2">
                <EditorContent editor={editor} className="tiptap notion-like" />
            </div>

            <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
                <div className="flex items-center gap-1 rounded-md border bg-white px-1 py-1 shadow-sm">
                    {toolbarButton({
                        active: editor.isActive('bold'),
                        onClick: () => editor.chain().focus().toggleBold().run(),
                        icon: <Bold className="h-4 w-4" />,
                        label: 'Bold',
                    })}
                    {toolbarButton({
                        active: editor.isActive('italic'),
                        onClick: () => editor.chain().focus().toggleItalic().run(),
                        icon: <Italic className="h-4 w-4" />,
                        label: 'Italic',
                    })}
                    {toolbarButton({
                        active: editor.isActive('strike'),
                        onClick: () => editor.chain().focus().toggleStrike().run(),
                        icon: <Strikethrough className="h-4 w-4" />,
                        label: 'Strike',
                    })}
                </div>
            </BubbleMenu>

            <FloatingMenu editor={editor} tippyOptions={{ duration: 150 }}>
                <div className="flex items-center gap-1 rounded-md border bg-white px-1 py-1 shadow-sm">
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
                        className="h-8 px-2 text-xs"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        H1
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                        className="h-8 px-2 text-xs"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        H2
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
                        className="h-8 px-2 text-xs"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    >
                        H3
                    </Button>
                </div>
            </FloatingMenu>
            <style jsx global>{`
                .tiptap {
                    outline: none;
                    white-space: normal;
                }
                .tiptap p {
                    margin: 0.35rem 0;
                    white-space: pre-wrap;
                }
                .tiptap ul,
                .tiptap ol {
                    padding-left: 1.25rem;
                    margin: 0.35rem 0;
                }
                .tiptap h1,
                .tiptap h2,
                .tiptap h3 {
                    font-weight: 700;
                    margin: 0.5rem 0 0.25rem;
                }
                .tiptap h1 { font-size: 1.25rem; }
                .tiptap h2 { font-size: 1.1rem; }
                .tiptap h3 { font-size: 1rem; }
                .tiptap blockquote {
                    border-left: 3px solid #cbd5e1;
                    padding-left: 0.75rem;
                    color: #475569;
                    margin: 0.35rem 0;
                }
                .tiptap hr {
                    border: none;
                    border-top: 1px solid #e2e8f0;
                    margin: 0.75rem 0;
                }
            `}</style>
        </div>
    )
}
