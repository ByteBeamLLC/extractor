import { SchemaField } from './schema'

export interface DependencyGraph {
  nodes: Map<string, SchemaField>
  edges: Map<string, Set<string>>
  reverseEdges: Map<string, Set<string>>
}

export interface ExecutionWave {
  fields: SchemaField[]
  wave: number
}

export interface DependencyError {
  type: 'circular' | 'missing' | 'self-reference'
  fieldId: string
  fieldName: string
  cycle?: string[]
  missingRef?: string
}

export function extractFieldReferences(config: any): string[] {
  if (!config) return []
  
  const configStr = typeof config === 'string' ? config : JSON.stringify(config)
  const matches = configStr.match(/\{([^}]+)\}/g) || []
  
  return matches.map(match => match.slice(1, -1).trim())
}

export function buildDependencyGraph(fields: SchemaField[]): DependencyGraph {
  const nodes = new Map<string, SchemaField>()
  const edges = new Map<string, Set<string>>()
  const reverseEdges = new Map<string, Set<string>>()
  
  fields.forEach(field => {
    nodes.set(field.id, field)
    edges.set(field.id, new Set())
    reverseEdges.set(field.id, new Set())
  })
  
  const fieldsByName = new Map(fields.map(f => [f.name, f]))
  
  fields.forEach(field => {
    if (!field.isTransformation) return
    
    const refs = extractFieldReferences(field.transformationConfig)
    
    refs.forEach(refName => {
      const refField = fieldsByName.get(refName)
      if (refField) {
        edges.get(field.id)?.add(refField.id)
        reverseEdges.get(refField.id)?.add(field.id)
      }
    })
  })
  
  return { nodes, edges, reverseEdges }
}

export function detectCycles(graph: DependencyGraph): DependencyError[] {
  const errors: DependencyError[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  
  function dfs(nodeId: string, path: string[]): string[] | null {
    if (visiting.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId)
      return path.slice(cycleStart).concat(nodeId)
    }
    
    if (visited.has(nodeId)) return null
    
    visiting.add(nodeId)
    path.push(nodeId)
    
    const dependencies = graph.edges.get(nodeId) || new Set()
    for (const depId of dependencies) {
      const cycle = dfs(depId, [...path])
      if (cycle) return cycle
    }
    
    visiting.delete(nodeId)
    visited.add(nodeId)
    return null
  }
  
  graph.nodes.forEach((field, nodeId) => {
    if (!visited.has(nodeId)) {
      const cycle = dfs(nodeId, [])
      if (cycle) {
        const cycleNames = cycle.map(id => graph.nodes.get(id)?.name || id)
        errors.push({
          type: 'circular',
          fieldId: nodeId,
          fieldName: field.name,
          cycle: cycleNames
        })
      }
    }
  })
  
  return errors
}

export function detectSelfReferences(fields: SchemaField[]): DependencyError[] {
  const errors: DependencyError[] = []
  
  fields.forEach(field => {
    if (!field.isTransformation) return
    
    const refs = extractFieldReferences(field.transformationConfig)
    if (refs.includes(field.name)) {
      errors.push({
        type: 'self-reference',
        fieldId: field.id,
        fieldName: field.name
      })
    }
  })
  
  return errors
}

export function detectMissingReferences(fields: SchemaField[]): DependencyError[] {
  const errors: DependencyError[] = []
  const fieldNames = new Set(fields.map(f => f.name))
  
  fields.forEach(field => {
    if (!field.isTransformation) return
    
    const refs = extractFieldReferences(field.transformationConfig)
    refs.forEach(refName => {
      if (!fieldNames.has(refName)) {
        errors.push({
          type: 'missing',
          fieldId: field.id,
          fieldName: field.name,
          missingRef: refName
        })
      }
    })
  })
  
  return errors
}

export function validateDependencies(fields: SchemaField[]): DependencyError[] {
  const errors: DependencyError[] = []
  
  errors.push(...detectSelfReferences(fields))
  errors.push(...detectMissingReferences(fields))
  
  if (errors.length === 0) {
    const graph = buildDependencyGraph(fields)
    errors.push(...detectCycles(graph))
  }
  
  return errors
}

export function topologicalSort(graph: DependencyGraph): ExecutionWave[] {
  const waves: ExecutionWave[] = []
  const inDegree = new Map<string, number>()
  const processed = new Set<string>()
  
  graph.nodes.forEach((_, nodeId) => {
    const deps = graph.edges.get(nodeId) || new Set()
    inDegree.set(nodeId, deps.size)
  })
  
  let waveNum = 0
  
  while (processed.size < graph.nodes.size) {
    const currentWave: SchemaField[] = []
    
    graph.nodes.forEach((field, nodeId) => {
      if (!processed.has(nodeId) && inDegree.get(nodeId) === 0) {
        currentWave.push(field)
      }
    })
    
    if (currentWave.length === 0) {
      break
    }
    
    currentWave.forEach(field => {
      processed.add(field.id)
      
      const dependents = graph.reverseEdges.get(field.id) || new Set()
      dependents.forEach(depId => {
        const current = inDegree.get(depId) || 0
        inDegree.set(depId, current - 1)
      })
    })
    
    waves.push({ fields: currentWave, wave: waveNum })
    waveNum++
  }
  
  return waves
}

export function getFieldDependencies(field: SchemaField, allFields: SchemaField[]): SchemaField[] {
  const refs = extractFieldReferences(field.transformationConfig)
  const fieldsByName = new Map(allFields.map(f => [f.name, f]))
  
  return refs
    .map(refName => fieldsByName.get(refName))
    .filter((f): f is SchemaField => f !== undefined)
}

export function getFieldDependents(field: SchemaField, allFields: SchemaField[]): SchemaField[] {
  const dependents: SchemaField[] = []
  
  allFields.forEach(f => {
    if (!f.isTransformation) return
    
    const refs = extractFieldReferences(f.transformationConfig)
    if (refs.includes(field.name)) {
      dependents.push(f)
    }
  })
  
  return dependents
}
