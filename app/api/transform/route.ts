import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText, generateObject, tool } from "ai"
import { z } from "zod"

const calculatorTool = tool({
  description: "A comprehensive calculator tool for performing arithmetic operations. Use this whenever you need to calculate mathematical expressions, including basic arithmetic, exponentiation, square roots, and more. The calculator supports: addition (+), subtraction (-), multiplication (*), division (/), exponentiation (^), square root (sqrt), parentheses for grouping, and follows proper order of operations.",
  inputSchema: z.object({
    expression: z.string().describe("The mathematical expression to evaluate. Examples: '2 + 2', '(10 * 5) - 3', '2 ^ 3', 'sqrt(16)', '(5 + 3) * 2 / 4'"),
  }),
  execute: async ({ expression }) => {
    try {
      const result = evaluateExpression(expression)
      return { result, expression }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid expression", expression }
    }
  },
})

const webSearchTool = tool({
  description: "Search the web for current information, facts, news, or any information that requires up-to-date knowledge. Use this tool when you need to find information that may not be in your training data or when you need current/recent information. The search returns relevant web results with titles, URLs, and content snippets.",
  inputSchema: z.object({
    query: z.string().describe("The search query to look up on the web. Be specific and clear about what information you're looking for."),
  }),
  execute: async ({ query }) => {
    try {
      const apiKey = process.env.JINA_API_KEY
      console.log("[bytebeam] Jina API Key check:", apiKey ? "Present" : "Missing")
      
      if (!apiKey) {
        return { error: "JINA_API_KEY not configured. Please set the JINA_API_KEY environment variable to enable web search." }
      }

      console.log("[bytebeam] Calling Jina Search API with query:", query)
      
      const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'X-Retain-Images': 'none',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Jina API error: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log("[bytebeam] Jina response received:", data)

      // Transform Jina response to match expected format
      const results = (data.data || []).slice(0, 5).map((result: any) => ({
        title: result.title || result.breadcrumb || '',
        url: result.url || '',
        content: result.content || result.description || '',
      }))

      return {
        query,
        results,
        answer: data.answer || results[0]?.content || "No direct answer available",
      }
    } catch (error) {
      console.error("[bytebeam] Jina search error:", error)
      return { error: error instanceof Error ? error.message : "Web search failed", query }
    }
  },
})

const webReaderTool = tool({
  description: "Read and extract full content from a specific URL. Use this tool when you need detailed information from a particular webpage that was found in search results, or when you need to read the content of a known URL. This provides the complete text content of the page in a clean, readable format.",
  inputSchema: z.object({
    url: z.string().describe("The URL of the webpage to read and extract content from. Must be a valid HTTP/HTTPS URL."),
  }),
  execute: async ({ url }) => {
    try {
      const apiKey = process.env.JINA_API_KEY
      console.log("[bytebeam] Jina Reader API - Reading URL:", url)
      
      if (!apiKey) {
        return { error: "JINA_API_KEY not configured. Please set the JINA_API_KEY environment variable to enable web reading." }
      }

      // Validate URL format
      try {
        new URL(url)
      } catch {
        return { error: "Invalid URL format", url }
      }

      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'X-Return-Format': 'json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Jina Reader API error: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log("[bytebeam] Jina Reader response received for:", url)

      return {
        url,
        title: data.title || '',
        content: data.content || data.text || '',
        description: data.description || '',
      }
    } catch (error) {
      console.error("[bytebeam] Jina Reader error:", error)
      return { error: error instanceof Error ? error.message : "Web reading failed", url }
    }
  },
})

// ===== PLANNER-OPERATOR-REFLECTOR ARCHITECTURE =====

// Type Definitions
interface Task {
  id: string
  description: string
  tool: 'calculator' | 'webSearch' | 'webReader'
  input: Record<string, any>
  dependsOn?: string[]
}

interface Plan {
  tasks: Task[]
  reasoning: string
}

interface ExecutionResult {
  taskId: string
  success: boolean
  output: any
  error?: string
}

interface ReflectionResult {
  status: 'SUCCESS' | 'RETRY' | 'FAIL'
  reasoning: string
  finalAnswer?: any
  replanInstructions?: string
}

// Planner Agent - Creates execution plans
async function planTasks(prompt: string, context: string): Promise<Plan> {
  const plannerPrompt = `You are a task planning agent. Analyze the request and create an execution plan.

Request: ${prompt}
Context: ${context}

Available tools:
- calculator: For mathematical operations
- webSearch: For finding current information, rates, prices
- webReader: For reading specific URLs

Create a task plan. For simple tasks (e.g., basic math, direct questions), create a single task.
For complex tasks (e.g., convert currency, calculate with external data), create multiple tasks with dependencies.

CRITICAL: For conversion/calculation tasks, you MUST include BOTH:
1. A webSearch task to find the rate/price
2. A calculator task that depends on the search (dependsOn: ['search_task_id'])

IMPORTANT: The "input" field must be a JSON STRING (not an object).
Use JSON.stringify() to serialize the input object.

Return a JSON plan with this structure:
{
  "tasks": [
    {
      "id": "task1",
      "description": "Find JOD to USD rate",
      "tool": "webSearch",
      "input": "{\"query\":\"JOD to USD conversion rate\"}"
    },
    {
      "id": "task2", 
      "description": "Calculate 666 * rate",
      "tool": "calculator",
      "input": "{\"expression\":\"666 * {rate_from_task1}\"}",
      "dependsOn": ["task1"]
    }
  ],
  "reasoning": "Need to find rate then calculate"
}`

  const result = await generateObject({
    model: google("gemini-2.5-pro"),
    temperature: 0.3,
    schema: z.object({
      tasks: z.array(z.object({
        id: z.string(),
        description: z.string(),
        tool: z.enum(['calculator', 'webSearch', 'webReader']),
        input: z.string(),  // Use string to avoid empty object schema issue
        dependsOn: z.array(z.string()).optional()
      })),
      reasoning: z.string()
    }),
    prompt: plannerPrompt
  })
  
  // Parse the input JSON string to object after receiving the result
  return {
    ...result.object,
    tasks: result.object.tasks.map(task => ({
      ...task,
      input: JSON.parse(task.input || '{}')
    }))
  }
}

// Helper function to extract numeric values from tool outputs using LLM
async function extractNumericValue(
  taskDescription: string,
  toolOutput: any
): Promise<number> {
  // Handle simple numeric outputs directly
  if (typeof toolOutput === 'number') return toolOutput
  if (toolOutput?.result !== undefined && typeof toolOutput.result === 'number') {
    return toolOutput.result
  }
  
  // For complex outputs (webSearch, etc.), use LLM to extract the number
  const extractionPrompt = `You are a data extraction agent. Extract ONLY the relevant numeric value from the tool output below.

Task Description: ${taskDescription}

Tool Output:
${JSON.stringify(toolOutput, null, 2)}

Extract the single most relevant number for this task. Return ONLY the number, no units or text.

Examples:
- If task is "Find JOD to USD rate" and output mentions "1 JOD = 1.4104 USD", return: 1.4104
- If task is "Get price of iPhone" and output says "$999", return: 999
- If task is "Find temperature in NYC" and output says "72°F", return: 72

Return only the numeric value as a number.`

  try {
    const result = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      temperature: 0,
      schema: z.object({
        value: z.number(),
        reasoning: z.string().optional()
      }),
      prompt: extractionPrompt
    })
    
    console.log(`[bytebeam] Transform - Extracted value ${result.object.value} from tool output (reason: ${result.object.reasoning})`)
    return result.object.value
  } catch (error) {
    console.error(`[bytebeam] Transform - Error extracting numeric value:`, error)
    // Fallback: try to parse as number
    const str = String(toolOutput)
    const match = str.match(/[\d.]+/)
    if (match) return parseFloat(match[0])
    throw new Error(`Could not extract numeric value from output`)
  }
}

// Helper function to resolve input placeholders
async function resolveInputs(
  input: Record<string, any>, 
  results: Map<string, ExecutionResult>,
  plan: Plan
): Promise<Record<string, any>> {
  const resolved: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.includes('{') && value.includes('}')) {
      // Replace placeholders like {rate_from_task1} with actual values
      let resolvedValue = value
      
      for (const [taskId, result] of results.entries()) {
        if (result.success && result.output) {
          // Find the task description from the plan
          const task = plan.tasks.find(t => t.id === taskId)
          const taskDescription = task?.description || 'Extract value'
          
          // Extract numeric result from tool output using LLM
          const numericValue = await extractNumericValue(taskDescription, result.output)
          
          resolvedValue = resolvedValue.replace(
            new RegExp(`\\{[^}]*${taskId}[^}]*\\}`, 'g'),
            String(numericValue)
          )
        }
      }
      resolved[key] = resolvedValue
    } else {
      resolved[key] = value
    }
  }
  
  return resolved
}

// Operator Agent - Executes plans with parallel task execution
async function executePlan(
  plan: Plan, 
  tools: Record<string, any>
): Promise<ExecutionResult[]> {
  const results: Map<string, ExecutionResult> = new Map()
  const pendingTasks = [...plan.tasks]
  
  while (pendingTasks.length > 0) {
    // Find tasks ready to execute (no dependencies or dependencies completed)
    const readyTasks = pendingTasks.filter(task => {
      if (!task.dependsOn || task.dependsOn.length === 0) return true
      return task.dependsOn.every(depId => results.has(depId) && results.get(depId)!.success)
    })
    
    if (readyTasks.length === 0) {
      // No tasks ready means we have unmet dependencies - fail remaining tasks
      for (const task of pendingTasks) {
        results.set(task.id, {
          taskId: task.id,
          success: false,
          output: null,
          error: 'Unmet dependencies'
        })
      }
      break
    }
    
    // Execute ready tasks in parallel
    const executions = await Promise.allSettled(
      readyTasks.map(async (task) => {
        try {
          // Resolve input values from dependent task results
          const resolvedInput = await resolveInputs(task.input, results, plan)
          
          const tool = tools[task.tool]
          if (!tool) throw new Error(`Tool ${task.tool} not found`)
          
          const output = await tool.execute(resolvedInput)
          
          return {
            taskId: task.id,
            success: true,
            output
          } as ExecutionResult
        } catch (error) {
          return {
            taskId: task.id,
            success: false,
            output: null,
            error: error instanceof Error ? error.message : String(error)
          } as ExecutionResult
        }
      })
    )
    
    // Store results
    executions.forEach((result, index) => {
      const taskResult = result.status === 'fulfilled' ? result.value : {
        taskId: readyTasks[index].id,
        success: false,
        output: null,
        error: 'Execution failed'
      }
      results.set(taskResult.taskId, taskResult)
    })
    
    // Remove completed tasks
    readyTasks.forEach(task => {
      const index = pendingTasks.indexOf(task)
      if (index > -1) pendingTasks.splice(index, 1)
    })
  }
  
  return Array.from(results.values())
}

// Reflector Agent - Reviews results and determines success
async function reflectOnResults(
  prompt: string,
  plan: Plan,
  results: ExecutionResult[],
  iteration: number
): Promise<ReflectionResult> {
  const reflectorPrompt = `You are a reflection agent. Review the execution results and determine if the goal was achieved.

Original Request: ${prompt}

Plan Executed:
${JSON.stringify(plan, null, 2)}

Execution Results:
${JSON.stringify(results, null, 2)}

Current Iteration: ${iteration}/3

Evaluate:
1. Was the original request fully satisfied?
2. For calculation/conversion tasks: Did we actually calculate the final number (not just find a rate)?
3. Is the final answer in the correct format?

Return your assessment with:
- status: "SUCCESS" if goal achieved, "RETRY" if need to replan, "FAIL" if cannot be done
- reasoning: Explain your decision
- finalAnswer: The final answer to return (if SUCCESS)
- replanInstructions: What to fix in the next plan (if RETRY)`

  const result = await generateObject({
    model: google("gemini-2.5-pro"),
    temperature: 0.2,
    schema: z.object({
      status: z.enum(['SUCCESS', 'RETRY', 'FAIL']),
      reasoning: z.string(),
      finalAnswer: z.any().optional(),
      replanInstructions: z.string().optional()
    }),
    prompt: reflectorPrompt
  })
  
  return result.object
}

// ===== END PLANNER-OPERATOR-REFLECTOR ARCHITECTURE =====

function evaluateExpression(expr: string): number {
  expr = expr.trim().toLowerCase()
  
  expr = expr.replace(/\s+/g, '')
  
  expr = expr.replace(/sqrt\(([^)]+)\)/g, (_, inner) => {
    const val = evaluateExpression(inner)
    if (val < 0) throw new Error("Cannot take square root of negative number")
    return String(Math.sqrt(val))
  })
  
  expr = expr.replace(/\^/g, '**')
  
  const isValidExpression = /^[0-9+\-*/(). **]+$/.test(expr)
  if (!isValidExpression) {
    throw new Error("Invalid characters in expression")
  }
  
  try {
    const result = Function('"use strict"; return (' + expr + ')')()
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error("Expression did not evaluate to a valid number")
    }
    return result
  } catch (error) {
    throw new Error("Invalid mathematical expression")
  }
}

// Schema builder utilities for type-aware transformations
function makePrimitive(fieldSchema: any): z.ZodTypeAny {
  const type = fieldSchema.type === "decimal" ? "number" : fieldSchema.type
  let prop: z.ZodTypeAny
  
  switch (type) {
    case "number":
      prop = z.number()
      if (fieldSchema.constraints?.min !== undefined) prop = prop.min(fieldSchema.constraints.min)
      if (fieldSchema.constraints?.max !== undefined) prop = prop.max(fieldSchema.constraints.max)
      break
    case "boolean":
      prop = z.boolean()
      break
    case "date":
      prop = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
    case "email":
      prop = z.string().email()
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
    case "url":
      prop = z.string().url()
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
    case "richtext":
    case "address":
    case "phone":
    case "string":
    default:
      prop = z.string()
      if (fieldSchema.constraints?.minLength !== undefined) prop = prop.min(fieldSchema.constraints.minLength)
      if (fieldSchema.constraints?.maxLength !== undefined) prop = prop.max(fieldSchema.constraints.maxLength)
      break
  }
  
  return prop
}

function buildFieldSchema(fieldSchema: any): z.ZodTypeAny {
  if (!fieldSchema || !fieldSchema.type) {
    return z.string()
  }
  
  const desc = `${fieldSchema.description || ""} ${fieldSchema.extractionInstructions || ""}`.trim()
  
  if (fieldSchema.type === "object") {
    const shape: Record<string, z.ZodTypeAny> = {}
    const children = fieldSchema.children || []
    
    for (const child of children) {
      const childSchema = buildFieldSchema(child)
      // Use id, name, or generate a key
      const key = child.id || child.name || `field_${Object.keys(shape).length}`
      shape[key] = childSchema
    }
    
    let prop: z.ZodTypeAny = z.object(shape)
    if (desc) prop = prop.describe(desc)
    return prop
  } else if (fieldSchema.type === "list") {
    const item = fieldSchema.item
    let zItem: z.ZodTypeAny
    
    if (item?.type === "object") {
      zItem = buildFieldSchema(item)
    } else if (item) {
      zItem = makePrimitive(item)
    } else {
      zItem = z.string()
    }
    
    let prop: z.ZodTypeAny = z.array(zItem)
    if (desc) prop = prop.describe(desc)
    return prop
  } else if (fieldSchema.type === "table") {
    const shape: Record<string, z.ZodTypeAny> = {}
    const columns = fieldSchema.columns || []
    
    for (const col of columns) {
      const colSchema = buildFieldSchema(col)
      // Use id, name, or generate a key
      const key = col.id || col.name || `col_${Object.keys(shape).length}`
      shape[key] = colSchema
    }
    
    let prop: z.ZodTypeAny = z.array(z.object(shape))
    if (desc) prop = prop.describe(desc)
    return prop
  } else {
    let prop = makePrimitive(fieldSchema)
    if (desc) prop = prop.describe(desc)
    return prop
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("[bytebeam] Transform API - Full request body:", JSON.stringify(body, null, 2))

    const inputSource: "document" | "column" = body.inputSource || "column"
    const prompt: string = String(body.prompt || "")

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Missing prompt" }, { status: 400 })
    }

    if (inputSource === "column") {
      const columnValues: Record<string, any> = body.columnValues || {}
      const fieldType = body.fieldType
      const fieldSchema = body.fieldSchema
      
      // Build a structured representation for the AI
      const columnContext: string[] = []
      const substitutedPrompt = prompt.replace(/\{([^}]+)\}/g, (match, columnName) => {
        const value = columnValues[columnName.trim()]
        if (value === undefined) return match
        
        // If value is an object/structured type, provide it as JSON context
        if (typeof value === 'object' && value !== null) {
          const jsonValue = JSON.stringify(value, null, 2)
          columnContext.push(`${columnName.trim()}: ${jsonValue}`)
          return `{${columnName.trim()}}`
        }
        
        // For primitive values, substitute directly
        return String(value)
      })
      
      console.log("[bytebeam] Transform - Original prompt:", prompt)
      console.log("[bytebeam] Transform - Column values:", columnValues)
      console.log("[bytebeam] Transform - Substituted prompt:", substitutedPrompt)
      console.log("[bytebeam] Transform - Column context:", columnContext)
      console.log("[bytebeam] Transform - Field type:", fieldType)
      console.log("[bytebeam] Transform - Field schema:", fieldSchema)
      
      // ===== PLANNER-OPERATOR-REFLECTOR ORCHESTRATION =====
      
      // Orchestration loop with max 3 iterations
      let iteration = 0
      let plan: Plan | null = null
      let executionResults: ExecutionResult[] = []
      let reflection: ReflectionResult | null = null
      let finalResult: any = null

      const contextInfo = columnContext.length > 0 
        ? `Available data:\n${columnContext.join('\n')}` 
        : ''

      while (iteration < 3) {
        iteration++
        console.log(`\n[bytebeam] Transform - ===== Iteration ${iteration}/3 =====`)
        
        // Step 1: Plan
        const planContext = iteration === 1 
          ? contextInfo 
          : `${contextInfo}\n\nPrevious attempt failed: ${reflection?.replanInstructions || ''}`
        
        plan = await planTasks(substitutedPrompt, planContext)
        console.log(`[bytebeam] Transform - Plan created:`, JSON.stringify(plan, null, 2))
        
        // Step 2: Execute
        const toolMap = {
          calculator: calculatorTool,
          webSearch: webSearchTool,
          webReader: webReaderTool
        }
        
        executionResults = await executePlan(plan, toolMap)
        console.log(`[bytebeam] Transform - Execution results:`, JSON.stringify(executionResults, null, 2))
        
        // Step 3: Reflect
        reflection = await reflectOnResults(substitutedPrompt, plan, executionResults, iteration)
        console.log(`[bytebeam] Transform - Reflection:`, JSON.stringify(reflection, null, 2))
        
        if (reflection.status === 'SUCCESS') {
          console.log(`[bytebeam] Transform - ✓ Success on iteration ${iteration}`)
          finalResult = reflection.finalAnswer
          break
        } else if (reflection.status === 'FAIL' || iteration >= 3) {
          console.log(`[bytebeam] Transform - ✗ Failed after ${iteration} iterations`)
          // Use best available result
          const lastSuccessfulResult = executionResults
            .filter(r => r.success)
            .pop()
          finalResult = lastSuccessfulResult?.output || "Unable to complete transformation"
          break
        }
        // Otherwise continue loop for RETRY
        console.log(`[bytebeam] Transform - → Retrying with new plan...`)
      }
      
      console.log(`[bytebeam] Transform - Final result from orchestration:`, finalResult)
      
      // Check if we have tool results from the last execution
      const hasToolResults = executionResults && executionResults.length > 0
      const lastToolResult = hasToolResults ? executionResults[executionResults.length - 1] : null
      const toolOutput = lastToolResult?.output as any
      
      // If we have field type information, use type-aware formatting
      if (fieldType && fieldSchema) {
        console.log("[bytebeam] Transform - Using type-aware formatting for type:", fieldType)
        
        try {
          // Build Zod schema for the field type
          let zodSchema = buildFieldSchema(fieldSchema)
          
          // For complex types (object, list, table), make schema more flexible with partial
          if (fieldType === 'object' || fieldType === 'list' || fieldType === 'table') {
            // Use partial() for objects to handle missing fields gracefully
            if (fieldType === 'object') {
              zodSchema = (zodSchema as z.ZodObject<any>).partial()
            }
          }
          
          // Determine source context from finalResult
          let sourceContext = ""
          let isEmpty = false
          
          const isPrimitiveType = !fieldType || ['string', 'number', 'decimal', 'boolean', 'date'].includes(fieldType)
          
          // The reflector has already determined the finalAnswer, so use it
          if (finalResult !== null && finalResult !== undefined) {
            if (typeof finalResult === 'string' && finalResult.trim()) {
              sourceContext = finalResult.trim()
              console.log("[bytebeam] Transform - Using reflector's final answer:", sourceContext)
            } else if (typeof finalResult === 'object') {
              sourceContext = JSON.stringify(finalResult, null, 2)
              console.log("[bytebeam] Transform - Using reflector's structured result")
            } else {
              sourceContext = String(finalResult)
              console.log("[bytebeam] Transform - Using reflector's result as string:", sourceContext)
            }
          } else if (hasToolResults && toolOutput) {
            // Fallback to tool output if no finalResult from reflector
            console.log("[bytebeam] Transform - Using tool output as fallback")
            
            if (toolOutput.results && Array.isArray(toolOutput.results)) {
              if (toolOutput.results.length === 0) {
                isEmpty = true
                sourceContext = "No results found"
              } else {
                sourceContext = JSON.stringify(toolOutput.results, null, 2)
              }
            } else if (toolOutput.result !== undefined) {
              sourceContext = String(toolOutput.result)
            } else if (toolOutput.error) {
              isEmpty = true
              sourceContext = `Error: ${toolOutput.error}`
            } else {
              sourceContext = JSON.stringify(toolOutput, null, 2)
            }
          } else {
            isEmpty = true
            sourceContext = "No content generated"
          }
          
          // Handle empty results
          if (isEmpty) {
            console.log("[bytebeam] Transform - Empty or error result")
            
            // Check if there's an error in tool output that we should surface
            if (toolOutput?.error) {
              const errorMsg = String(toolOutput.error)
              // If it's an API key error, provide helpful guidance
              if (errorMsg.includes('JINA_API_KEY not configured') || errorMsg.includes('403') || errorMsg.includes('401')) {
                throw new Error(`${errorMsg}. To fix this, get a free API key from https://jina.ai and set the JINA_API_KEY environment variable.`)
              }
              // For other errors, try to continue without the search data
              console.warn("[bytebeam] Transform - Tool error:", errorMsg)
            }
            
            if (fieldType === 'list' || fieldType === 'table') {
              finalResult = []
            } else if (fieldType === 'object') {
              finalResult = {}
            } else {
              // For primitives, maintain backward compatibility with empty string
              finalResult = sourceContext
            }
          } else {
            // Use generateObject for structured formatting
            const formatPrompt = `Extract and format the following data according to the required schema.

Source Data:
${sourceContext}

Original Task: ${substitutedPrompt}

Instructions:
- For list/table types: Extract all items as an array of objects. If no data, return empty array.
- For object types: Extract fields matching the schema. Set missing fields to null.
- For primitive types: Extract the single most relevant value.
- Preserve all important information from the source data
- For web search results, extract store names, URLs, and prices if available
- Ensure data types match the schema (numbers as numbers, not strings)
- If information is not available, use null for that field rather than omitting it`

            const structuredResult = await generateObject({
              model: google("gemini-2.5-pro"),
              temperature: 0.1,
              schema: zodSchema,
              prompt: formatPrompt,
            })
            
            finalResult = structuredResult.object
            console.log("[bytebeam] Transform - Structured result:", JSON.stringify(finalResult, null, 2))
          }
          
        } catch (error) {
          console.error("[bytebeam] Transform - Type-aware formatting error:", error)
          // Fall back to text representation on error
          if (toolOutput?.results && Array.isArray(toolOutput.results)) {
            // Format web search results as text
            const formattedResults = toolOutput.results.map((r: any, idx: number) => 
              `${idx + 1}. ${r.title}\n   ${r.url}\n   ${r.content}`
            ).join('\n\n')
            finalResult = formattedResults
          } else if (toolOutput?.result !== undefined) {
            // Return calculator result
            finalResult = String(toolOutput.result)
          } else if (finalResult) {
            // Keep the finalResult from reflector
            finalResult = String(finalResult)
          } else {
            // Last resort: error message
            finalResult = "Error formatting result: " + (error instanceof Error ? error.message : String(error))
          }
        }
      } else if ((!finalResult || (typeof finalResult === 'string' && finalResult.trim() === '')) && hasToolResults && toolOutput) {
        // Fallback to legacy formatting for backward compatibility
        console.log("[bytebeam] Transform - Using legacy formatting (no type info)")
        
        if (toolOutput && typeof toolOutput.result === 'number') {
          finalResult = String(toolOutput.result)
          console.log("[bytebeam] Transform - Extracted number from toolOutput.result:", finalResult)
        } else if (typeof toolOutput === 'number') {
          finalResult = String(toolOutput)
          console.log("[bytebeam] Transform - Extracted number from toolOutput:", finalResult)
        } else if (toolOutput && toolOutput.results && Array.isArray(toolOutput.results)) {
          const formattedResults = toolOutput.results.map((r: any, idx: number) => 
            `${idx + 1}. ${r.title}\n   ${r.url}\n   ${r.content}`
          ).join('\n\n')
          finalResult = formattedResults
          console.log("[bytebeam] Transform - Extracted web search results, count:", toolOutput.results.length)
        } else if (toolOutput && toolOutput.answer && toolOutput.answer !== "No direct answer available") {
          finalResult = toolOutput.answer
          console.log("[bytebeam] Transform - Extracted answer from web search:", finalResult)
        } else {
          console.log("[bytebeam] Transform - Could not extract result, toolOutput type:", typeof toolOutput)
        }
      }
      
      console.log("[bytebeam] Transform - Final result:", finalResult)
      
      // Return the result (can be string, object, or array)
      return NextResponse.json({ 
        success: true, 
        result: typeof finalResult === 'object' ? JSON.stringify(finalResult) : (finalResult || "Error: No result")
      })
    }

    // inputSource === 'document'
    const file = body.file
    if (!file || !file.data) {
      return NextResponse.json({ success: false, error: "Missing file for document transformation" }, { status: 400 })
    }

    const binaryData = Buffer.from(file.data, "base64")
    const bytes = new Uint8Array(binaryData)

    const fileName = file.name || "document"
    const fileType = file.type || "application/octet-stream"
    const isImage = fileType.startsWith("image/") || /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(fileName)

    if (isImage) {
      const base64 = Buffer.from(bytes).toString("base64")
      const mimeType = fileType || "image/png"
      const { text, toolResults } = await generateText({
        model: google("gemini-2.5-pro"),
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Task: ${prompt}

⚠️ CRITICAL: For conversion/calculation tasks, you MUST:
1. webSearch to find rate/price/data
2. calculator to perform actual calculation ← REQUIRED!
3. Output ONLY the final calculated number

🚫 NEVER stop after just webSearch!
✅ ALWAYS call calculator after webSearch for conversion/calculation tasks!
✅ Output the FINAL calculated result!

Example: "Convert 100 X to Y"
✓ webSearch → find rate
✓ calculator("100 * rate") ← MUST DO THIS!
✓ Output calculated result (NOT the rate!)

Return ONLY the final number.` },
              { type: "image", image: `data:${mimeType};base64,${base64}` },
            ],
          },
        ],
        tools: {
          calculator: calculatorTool,
          webSearch: webSearchTool,
          webReader: webReaderTool,
        },
        maxSteps: 10,
      })
      
      // Prefer calculator result if available
      let finalDocResult = text
      const lastCalculatorResult = toolResults
        ?.filter((tr: any) => tr.toolName === 'calculator')
        ?.pop()
      if (lastCalculatorResult?.output?.result !== undefined) {
        finalDocResult = String(lastCalculatorResult.output.result)
      }
      
      return NextResponse.json({ success: true, result: finalDocResult })
    }

    // Try to decode as UTF-8 text; if it's not text, the output may be garbled but still usable as context
    const docText = new TextDecoder().decode(bytes)
    const { text, toolResults } = await generateText({
      model: google("gemini-2.5-pro"),
      temperature: 0.3,
      prompt: `Task: ${prompt}

Document:
${docText}

⚠️ CRITICAL: For conversion/calculation tasks, you MUST:
1. webSearch to find rate/price/data
2. calculator to perform actual calculation ← REQUIRED!
3. Output ONLY the final calculated number

🚫 NEVER stop after just webSearch!
✅ ALWAYS call calculator after webSearch for conversion/calculation tasks!
✅ Output the FINAL calculated result!

Example: "Convert 100 X to Y"
✓ webSearch → find rate
✓ calculator("100 * rate") ← MUST DO THIS!
✓ Output calculated result (NOT the rate!)

Return ONLY the final number.`,
      tools: {
        calculator: calculatorTool,
        webSearch: webSearchTool,
        webReader: webReaderTool,
      },
      maxSteps: 10,
    })
    
    // Prefer calculator result if available
    let finalTextResult = text
    const lastCalculatorResult = toolResults
      ?.filter((tr: any) => tr.toolName === 'calculator')
      ?.pop()
    if (lastCalculatorResult?.output?.result !== undefined) {
      finalTextResult = String(lastCalculatorResult.output.result)
    }
    
    return NextResponse.json({ success: true, result: finalTextResult })
  } catch (error) {
    console.error("[bytebeam] Transform error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
