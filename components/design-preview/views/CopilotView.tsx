"use client"

import * as React from "react"
import {
    Send,
    Paperclip,
    Bot,
    User,
    Sparkles,
    Search,
    Database,
    Play,
    FileText,
    CheckCircle2,
    Loader2,
    ChevronRight,
    ChevronDown,
    Plus,
    History,
    Settings,
    BrainCircuit,
    ListTodo,
    MessageSquare,
    Mic,
    ArrowUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    attachments?: string[]
    tools?: ToolCall[]
}

interface ToolCall {
    id: string
    name: string
    status: "running" | "completed" | "failed"
    result?: string
    args?: string
}

interface ChatSession {
    id: string
    title: string
    date: Date
}



const MOCK_HISTORY: { label: string, items: ChatSession[] }[] = [
    {
        label: "Today",
        items: [
            { id: "1", title: "for campaign: 'ByteBeam Financial Services'", date: new Date() },
            { id: "2", title: "for cmaipaign", date: new Date() },
            { id: "3", title: "list all sequences and variations", date: new Date() },
        ]
    },
    {
        label: "Previous 7 Days",
        items: [
            { id: "4", title: "delete all leads in 'ByteBeam...", date: new Date(Date.now() - 86400000 * 2) },
            { id: "5", title: "so in my bytebeam fs campaign...", date: new Date(Date.now() - 86400000 * 3) },
            { id: "6", title: "disable Campaign Slow Ramp on...", date: new Date(Date.now() - 86400000 * 4) },
        ]
    }
]

export function CopilotView() {
    const [messages, setMessages] = React.useState<Message[]>([])
    const [inputValue, setInputValue] = React.useState("")
    const [isTyping, setIsTyping] = React.useState(false)
    const [activeChatId, setActiveChatId] = React.useState<string | null>(null)

    // Reset to empty state when creating new chat
    const handleNewChat = () => {
        setMessages([])
        setActiveChatId(null)
        setInputValue("")
    }

    const handleLoadChat = (chatId: string) => {
        setActiveChatId(chatId)
        // Mock loading messages for a history item
        setMessages([
            {
                id: "h1",
                role: "user",
                content: "Show me the performance of the ByteBeam campaign",
                timestamp: new Date()
            },
            {
                id: "h2",
                role: "assistant",
                content: "Here is the performance data for the ByteBeam Financial Services campaign.",
                timestamp: new Date(),
                tools: [
                    { id: "t1", name: "get_campaign_analytics", status: "completed", args: "{ campaign_id: 'cmp_123' }", result: "Open Rate: 45%, Reply Rate: 12%" }
                ]
            }
        ])
    }

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return

        const newMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, newMessage])
        setInputValue("")
        setIsTyping(true)

        // Simulate AI processing and tool usage
        setTimeout(() => {
            processUserRequest(content)
        }, 1000)
    }

    const processUserRequest = (content: string) => {
        const lowerContent = content.toLowerCase()
        let responseMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "",
            timestamp: new Date(),
            tools: []
        }

        if (lowerContent.includes("how many jobs") && lowerContent.includes("fmcg")) {
            responseMessage.tools = [
                { id: "t1", name: "find_agent", status: "running", args: "{ name: 'fmcg localization' }" },
            ]
            setMessages(prev => [...prev, responseMessage])

            setTimeout(() => {
                updateToolStatus(responseMessage.id, "t1", "completed", "Found agent: FMCG Localization (ID: agt_123)")
                addToolCall(responseMessage.id, { id: "t2", name: "list_jobs", status: "running", args: "{ agent_id: 'agt_123', status: 'running' }" })

                setTimeout(() => {
                    updateToolStatus(responseMessage.id, "t2", "completed", "Found 3 running jobs")
                    updateMessageContent(responseMessage.id, "I found the 'FMCG Localization' agent. There are currently **3 jobs** running for this agent.")
                    setIsTyping(false)
                }, 1500)
            }, 1500)
        } else if (lowerContent.includes("policy")) {
            responseMessage.tools = [
                { id: "t3", name: "search_knowledge_base", status: "running", args: "{ query: 'policy data retention' }" },
            ]
            setMessages(prev => [...prev, responseMessage])

            setTimeout(() => {
                updateToolStatus(responseMessage.id, "t3", "completed", "Found 2 documents")
                updateMessageContent(responseMessage.id, "I found information about data retention policies in the **'Compliance Handbook 2024'** and **'Privacy Guidelines'**.")
                setIsTyping(false)
            }, 2000)
        } else {
            responseMessage.content = "I can help with that. Could you provide more details?"
            setMessages(prev => [...prev, responseMessage])
            setIsTyping(false)
        }
    }

    const updateToolStatus = (messageId: string, toolId: string, status: "running" | "completed" | "failed", result?: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId && msg.tools) {
                return {
                    ...msg,
                    tools: msg.tools.map(t => t.id === toolId ? { ...t, status, result } : t)
                }
            }
            return msg
        }))
    }

    const addToolCall = (messageId: string, tool: ToolCall) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    tools: [...(msg.tools || []), tool]
                }
            }
            return msg
        }))
    }

    const updateMessageContent = (messageId: string, content: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, content }
            }
            return msg
        }))
    }

    return (
        <div className="flex h-full bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 flex-none border-r bg-muted/10 flex flex-col">
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-6 px-2">
                        <div className="p-1 bg-blue-600 rounded-md">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">Instantly Copilot</span>
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
                        {MOCK_HISTORY.map((section, idx) => (
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
                {messages.length === 0 ? (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
                        <h1 className="text-2xl font-semibold mb-8">What can I help with?</h1>

                        <div className="w-full relative mb-8">
                            <div className="relative flex items-center bg-muted/30 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-ring transition-all">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage(inputValue)
                                        }
                                    }}
                                    placeholder="Ask Instantly AI or type / to see prompts..."
                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 h-auto text-base shadow-none"
                                />
                                <div className="flex items-center gap-2 pr-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <Mic className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleSendMessage(inputValue)}
                                        disabled={!inputValue.trim()}
                                        size="icon"
                                        className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
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
                                            {msg.tools && msg.tools.length > 0 && (
                                                <div className="flex flex-col gap-2 w-full mb-2">
                                                    {msg.tools.map(tool => (
                                                        <ToolCallDisplay key={tool.id} tool={tool} />
                                                    ))}
                                                </div>
                                            )}

                                            {msg.content && (
                                                <div className={cn(
                                                    "text-sm leading-relaxed",
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
                                <div className="relative flex items-center bg-muted/30 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-ring transition-all">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage(inputValue)
                                            }
                                        }}
                                        placeholder="Ask Instantly AI..."
                                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-2 h-auto text-base shadow-none"
                                    />
                                    <div className="flex items-center gap-2 pr-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Mic className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleSendMessage(inputValue)}
                                            disabled={!inputValue.trim()}
                                            size="icon"
                                            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
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

function ToolCallDisplay({ tool }: { tool: ToolCall }) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    return (
        <div className="w-full bg-card border rounded-md overflow-hidden text-sm my-2">
            <div
                className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {tool.status === "running" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : tool.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                        <div className="w-4 h-4 rounded-full bg-red-500" />
                    )}
                    <span className="font-medium text-sm">{tool.name.replace(/_/g, ' ')}</span>
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
                            {tool.args}
                        </div>
                    </div>
                    {tool.result && (
                        <div>
                            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1.5">Result</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded text-muted-foreground break-all">
                                {tool.result}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
