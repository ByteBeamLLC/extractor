import type {
  FlatLeaf,
  LeafField,
  ListField,
  ObjectField,
  SchemaField,
  TableField,
} from "./types"

export function isLeaf(field: SchemaField): field is LeafField {
  return field.type !== "object" && field.type !== "list" && field.type !== "table"
}

export function flattenFields(fields: SchemaField[] = [], parentPath: string[] = []): FlatLeaf[] {
  const out: FlatLeaf[] = []
  for (const f of fields) {
    if (isLeaf(f)) {
      out.push({ ...(f as LeafField), path: [...parentPath, f.name] })
    } else if (f.type === "object") {
      out.push({ ...(f as ObjectField), path: [...parentPath, f.name] })
    } else if (f.type === "list" || f.type === "table") {
      out.push({ ...(f as SchemaField), path: [...parentPath, f.name] })
    }
  }
  return out
}

export function updateFieldById(
  fields: SchemaField[],
  id: string,
  updater: (f: SchemaField) => SchemaField,
): SchemaField[] {
  return fields.map((f) => {
    if (f.id === id) return updater(f)
    if (f.type === "object") {
      return { ...f, children: updateFieldById((f as ObjectField).children, id, updater) } as ObjectField
    }
    if (f.type === "list") {
      const lf = f as ListField
      if (lf.item.id === id) return { ...lf, item: updater(lf.item) }
      if (lf.item.type === "object" || lf.item.type === "table" || lf.item.type === "list") {
        return { ...lf, item: updateFieldById([lf.item], id, updater)[0] } as ListField
      }
      return lf
    }
    if (f.type === "table") {
      const tf = f as TableField
      return { ...tf, columns: updateFieldById(tf.columns, id, updater) } as TableField
    }
    return f
  })
}

export function removeFieldById(fields: SchemaField[], id: string): SchemaField[] {
  const out: SchemaField[] = []
  for (const f of fields) {
    if (f.id === id) continue
    if (f.type === "object") {
      out.push({ ...f, children: removeFieldById((f as ObjectField).children, id) } as ObjectField)
    } else if (f.type === "list") {
      const lf = f as ListField
      let item = lf.item
      if (item.id === id) {
        continue
      }
      if (item.type === "object" || item.type === "table" || item.type === "list") {
        item = removeFieldById([item], id)[0]
      }
      out.push({ ...lf, item } as ListField)
    } else if (f.type === "table") {
      const tf = f as TableField
      out.push({ ...tf, columns: removeFieldById(tf.columns, id) } as TableField)
    } else {
      out.push(f)
    }
  }
  return out
}

export function flattenResultsById(fields: SchemaField[], nested: any): Record<string, any> {
  const out: Record<string, any> = {}
  const walk = (fs: SchemaField[], node: any) => {
    for (const f of fs) {
      if (node == null) continue
      const v = node[f.id]
      if (isLeaf(f)) {
        out[f.id] = v ?? null
      } else if (f.type === "object") {
        out[f.id] = v ?? null
      } else if (f.type === "list") {
        out[f.id] = Array.isArray(v) ? v : v ?? null
      } else if (f.type === "table") {
        out[f.id] = Array.isArray(v) ? v : v ?? null
      }
    }
  }
  walk(fields, nested || {})
  return out
}
