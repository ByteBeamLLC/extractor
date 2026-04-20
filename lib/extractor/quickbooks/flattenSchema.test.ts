import { describe, expect, it } from "vitest"
import { flattenSchema } from "./flattenSchema"
import type { SchemaField } from "@/lib/schema"

describe("flattenSchema", () => {
  it("returns leaf fields with their id and name", () => {
    const fields: SchemaField[] = [
      { id: "vendor_name", name: "Vendor Name", type: "string" },
      { id: "total", name: "Total", type: "number" },
    ]
    expect(flattenSchema(fields)).toEqual([
      { id: "vendor_name", label: "Vendor Name", isList: false },
      { id: "total", label: "Total", isList: false },
    ])
  })

  it("flattens object fields with arrow-joined labels and dotted ids", () => {
    const fields: SchemaField[] = [
      {
        id: "vendor",
        name: "Vendor",
        type: "object",
        children: [
          { id: "name", name: "Name", type: "string" },
          { id: "email", name: "Email", type: "email" },
        ],
      },
    ]
    expect(flattenSchema(fields)).toEqual([
      { id: "vendor.name", label: "Vendor → Name", isList: false },
      { id: "vendor.email", label: "Vendor → Email", isList: false },
    ])
  })

  it("emits list fields with isList=true PLUS their row's primitive children", () => {
    const fields: SchemaField[] = [
      {
        id: "items",
        name: "Items",
        type: "list",
        item: {
          id: "row",
          name: "Row",
          type: "object",
          children: [
            { id: "desc", name: "Description", type: "string" },
            { id: "amount", name: "Amount", type: "number" },
          ],
        } as SchemaField,
      },
    ]
    const result = flattenSchema(fields)
    // First entry is the list itself.
    expect(result[0]).toEqual({ id: "items", label: "Items", isList: true })
    // Then primitive children prefixed with [0].
    const childIds = result.slice(1).map((f) => f.id)
    expect(childIds).toContain("items[0].desc")
    expect(childIds).toContain("items[0].amount")
  })

  it("emits table fields the same way as lists, using their columns", () => {
    const fields: SchemaField[] = [
      {
        id: "lines",
        name: "Lines",
        type: "table",
        columns: [
          { id: "qty", name: "Qty", type: "number" },
          { id: "sku", name: "SKU", type: "string" },
        ],
      },
    ]
    const result = flattenSchema(fields)
    expect(result[0]).toEqual({ id: "lines", label: "Lines", isList: true })
    expect(result.find((f) => f.id === "lines[0].qty")?.label).toBe("Lines → row → Qty")
    expect(result.find((f) => f.id === "lines[0].sku")?.label).toBe("Lines → row → SKU")
  })

  it("skips input fields entirely (they aren't extractable values)", () => {
    const fields: SchemaField[] = [
      { id: "doc_input", name: "Doc Input", type: "input", inputType: "document" } as SchemaField,
      { id: "vendor", name: "Vendor", type: "string" },
    ]
    const result = flattenSchema(fields)
    expect(result).toEqual([{ id: "vendor", label: "Vendor", isList: false }])
  })

  it("returns an empty list for an empty schema (no crash)", () => {
    expect(flattenSchema([])).toEqual([])
  })

  it("handles deeply nested object → list → object combos", () => {
    const fields: SchemaField[] = [
      {
        id: "invoice",
        name: "Invoice",
        type: "object",
        children: [
          {
            id: "items",
            name: "Items",
            type: "list",
            item: {
              id: "row",
              name: "Row",
              type: "object",
              children: [{ id: "desc", name: "Description", type: "string" }],
            } as SchemaField,
          },
        ],
      },
    ]
    const result = flattenSchema(fields)
    expect(result.find((f) => f.id === "invoice.items")).toMatchObject({
      label: "Invoice → Items",
      isList: true,
    })
    expect(result.find((f) => f.id === "invoice.items[0].desc")).toMatchObject({
      label: "Invoice → Items → row → Description",
      isList: false,
    })
  })
})
