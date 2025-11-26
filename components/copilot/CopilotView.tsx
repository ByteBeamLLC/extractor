
"use client"

import * as React from "react"
import {
    Sparkles,
    Plus,
    Mic,
    ArrowUp,
    Paperclip,
    Loader2,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileText,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createChat, getChats, getChatMessages, sendMessage } from "@/lib/copilot/actions"
import { CopilotChat, CopilotMessage } from "@/lib/copilot/types"
import { format } from "date-fns"

export function CopilotView() {
    const [chats, setChats] = React.useState<CopilotChat[]>([])
    const [messages, setMessages] = React.useState<CopilotMessage[]>([])
    const [activeChatId, setActiveChatId] = React.useState<string | null>(null)
    const [inputValue, setInputValue] = React.useState("")
    const [isTyping, setIsTyping] = React.useState(false)
    const [attachments, setAttachments] = React.useState<string[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        loadChats()
    }, [])

    const loadChats = async () => {
        const data = await getChats()
        setChats(data)
    }

    const handleNewChat = async () => {
        // Optimistically clear UI, create chat on first message or immediately?
        // Let's create immediately to have an ID
        setMessages([])
        setActiveChatId(null)
        setInputValue("")
        setAttachments([])
    }

    const handleLoadChat = async (chatId: string) => {
        setActiveChatId(chatId)
        setMessages([]) // Clear while loading
        const msgs = await getChatMessages(chatId)
        setMessages(msgs)
    }

    const handleSendMessage = async () => {
        if (!inputValue.trim() && attachments.length === 0) return

        const content = inputValue
        const currentAttachments = [...attachments]

        setInputValue("")
        setAttachments([])
        setIsTyping(true)

        let chatId = activeChatId

        if (!chatId) {
            try {
                const newChat = await createChat(content.slice(0, 30) || 'New Chat')
                setChats(prev => [newChat, ...prev])
                chatId = newChat.id
                setActiveChatId(chatId)
            } catch (e) {
                console.error("Failed to create chat", e)
                setIsTyping(false)
                return
            }
        }

        // Optimistic update
        const tempId = Date.now().toString()
        setMessages(prev => [...prev, {
            id: tempId,
            chat_id: chatId!,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
            // We don't display attachments in history yet, but could add a local property
        }])

        try {
            const newMessages = await sendMessage({
                chatId: chatId!,
                content,
                attachments: currentAttachments
            })
            setMessages(newMessages)
        } catch (e) {
            console.error("Failed to send message", e)
            // Remove optimistic message or show error
        } finally {
            setIsTyping(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                setAttachments(prev => [...prev, result])
            }
            reader.readAsDataURL(file)
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    // Group chats by date (simplified)
    const groupedChats = React.useMemo(() => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const groups: { label: string, items: CopilotChat[] }[] = [
            { label: "Recent", items: [] }
        ]

        chats.forEach(chat => {
            groups[0].items.push(chat)
        })

        return groups
    }, [chats])

    return (
        <div className="flex h-full bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 flex-none border-r bg-muted/10 flex flex-col">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-6 px-2">
                        <div className="p-1 bg-blue-600 rounded-md">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">Copilot</span>
                    </div>

                    <Button
                        onClick={handleNewChat}
                        className="w-full justify-start gap-2 bg-muted/50 hover:bg-muted text-foreground border-none shadow-none"
                        variant="outline"
                    >
                        <Plus className="w-4 h-4" />
                        New chat
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-3 py-4">
                    <div className="space-y-6">
                        {groupedChats.map((section, idx) => (
                            <div key={idx}>
                                <h3 className="text-xs font-medium text-muted-foreground px-3 mb-2">{section.label}</h3>
                                <div className="space-y-0.5">
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleLoadChat(item.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors truncate",
                                                activeChatId === item.id
                                                    ? "bg-muted text-foreground"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            {item.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {messages.length === 0 && !activeChatId ? (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
                        <h1 className="text-2xl font-semibold mb-8">What can I help with?</h1>

                        <div className="w-full relative mb-8">
                            <div className="relative flex flex-col bg-muted/30 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-ring transition-all">
                                {attachments.length > 0 && (
                                    <div className="flex gap-2 p-2 flex-wrap">
                                        {attachments.map((att, i) => (
                                            <div key={i} className="relative w-16 h-16 bg-background rounded border overflow-hidden group">
                                                <img src={att} alt="attachment" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeAttachment(i)}
                                                    className="absolute top-0 right-0 bg-black/50 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage()
                                            }
                                        }}
                                        placeholder="Ask Instantly AI..."
                                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 h-auto text-base shadow-none flex-1"
                                    />
                                    <div className="flex items-center gap-2 pr-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            accept="image/*,.pdf" // Add more types if needed
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Mic className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!inputValue.trim() && attachments.length === 0}
                                            size="icon"
                                            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Chat Interface
                    <>
                        <ScrollArea className="flex-1 p-4">
                            <div className="max-w-3xl mx-auto space-y-8 py-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-4",
                                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        {msg.role !== "user" && (
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                        )}

                                        <div className={cn(
                                            "flex flex-col gap-2 max-w-[80%]",
                                            msg.role === "user" ? "items-end" : "items-start"
                                        )}>
                                            {msg.tool_calls && msg.tool_calls.length > 0 && (
                                                <div className="flex flex-col gap-2 w-full mb-2">
                                                    {msg.tool_calls.map((tool: any) => (
                                                        <ToolCallDisplay
                                                            key={tool.id}
                                                            tool={tool}
                                                            results={msg.tool_results}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {msg.content && (
                                                <div className={cn(
                                                    "text-sm leading-relaxed whitespace-pre-wrap",
                                                    msg.role === "user"
                                                        ? "bg-muted/50 px-4 py-2 rounded-2xl rounded-tr-sm"
                                                        : ""
                                                )}>
                                                    {msg.content}
                                                </div>
                                            )}

                                            {msg.role === "assistant" && !msg.content && isTyping && (
                                                <div className="flex items-center gap-1 p-2">
                                                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                                                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce delay-75" />
                                                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce delay-150" />
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-1">
                                                {msg.role === "assistant" && (
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                                            <FileText className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="flex-none p-4 bg-background">
                            <div className="max-w-3xl mx-auto">
                                <div className="relative flex flex-col bg-muted/30 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-ring transition-all">
                                    {attachments.length > 0 && (
                                        <div className="flex gap-2 p-2 flex-wrap">
                                            {attachments.map((att, i) => (
                                                <div key={i} className="relative w-16 h-16 bg-background rounded border overflow-hidden group">
                                                    <img src={att} alt="attachment" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeAttachment(i)}
                                                        className="absolute top-0 right-0 bg-black/50 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <Input
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleSendMessage()
                                                }
                                            }}
                                            placeholder="Ask Instantly AI..."
                                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-2 h-auto text-base shadow-none flex-1"
                                        />
                                        <div className="flex items-center gap-2 pr-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileSelect}
                                                accept="image/*,.pdf"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Paperclip className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <Mic className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                onClick={handleSendMessage}
                                                disabled={!inputValue.trim() && attachments.length === 0}
                                                size="icon"
                                                className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function ToolCallDisplay({ tool, results }: { tool: any, results?: any[] }) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    // Find result for this tool call
    const result = results?.find((r: any) => r.tool_call_id === tool.id)
    const status = result ? "completed" : "running"

    return (
        <div className="w-full bg-card border rounded-md overflow-hidden text-sm my-2">
            <div
                className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {status === "running" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    <span className="font-medium text-sm">{tool.function.name.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-3 border-t bg-muted/10 space-y-3">
                    <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1.5">Arguments</div>
                        <div className="font-mono text-xs bg-muted p-2 rounded text-muted-foreground break-all">
                            {tool.function.arguments}
                        </div>
                    </div>
                    {result && (
                        <div>
                            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1.5">Result</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded text-muted-foreground break-all max-h-40 overflow-y-auto">
                                {result.content}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
