import { describe, expect, it } from "vitest"

import type { ObjectField, SchemaField } from "@/lib/schema/types"
import {
  flattenFields,
  flattenResultsById,
  removeFieldById,
  updateFieldById,
} from "@/lib/schema/treeOps"

const schemaTree: SchemaField[] = [
  {
    id: "root",
    name: "Root",
    type: "object",
    children: [
      { id: "name", name: "Name", type: "string" },
      { id: "qty", name: "Quantity", type: "number" },
      {
        id: "nested",
        name: "Nested",
        type: "object",
        children: [{ id: "code", name: "Code", type: "string" }],
      },
    ],
  } as ObjectField,
  {
    id: "items",
    name: "Items",
    type: "list",
    item: {
      id: "itemName",
      name: "Item Name",
      type: "string",
    },
  },
]

describe("treeOps", () => {
  it("flattens nested paths with breadcrumb metadata", () => {
    const root = schemaTree[0] as ObjectField
    const flattened = flattenFields(root.children, [root.name])

    const nameField = flattened.find((field) => field.id === "name")
    expect(nameField?.path).toEqual(["Root", "Name"])

    const nestedField = flattened.find((field) => field.id === "nested")
    expect(nestedField?.path).toEqual(["Root", "Nested"])
  })

  it("updates deeply nested fields immutably", () => {
    const updated = updateFieldById(schemaTree, "code", (field) => ({
      ...field,
      name: "Product Code",
    }))

    const originalNested = ((schemaTree[0] as ObjectField).children?.find(
      (field) => field.id === "nested",
    ) as ObjectField).children?.find((field) => field.id === "code")
    const updatedNested = ((updated[0] as ObjectField).children?.find(
      (field) => field.id === "nested",
    ) as ObjectField).children?.find((field) => field.id === "code")

    expect(updatedNested?.name).toBe("Product Code")
    expect(originalNested?.name).toBe("Code")
  })

  it("removes list definitions when the child field is deleted", () => {
    const cleaned = removeFieldById(schemaTree, "itemName")
    expect(cleaned.some((field) => field.id === "items")).toBe(false)
  })

  it("flattens result payloads by field id", () => {
    const root = schemaTree[0] as ObjectField
    const flattened = flattenResultsById(root.children, {
      name: "Widget",
      qty: 3,
      nested: { code: "A-123" },
    })

    expect(flattened).toMatchObject({
      name: "Widget",
      qty: 3,
      nested: { code: "A-123" },
    })
  })
})
