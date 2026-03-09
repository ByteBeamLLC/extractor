import type { SchemaField } from "@/lib/schema"

export interface ParserTemplate {
  id: string
  name: string
  description: string
  /** Returns fresh fields with unique IDs on every call */
  buildFields: () => SchemaField[]
}

function uid() {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const parserTemplates: ParserTemplate[] = [
  {
    id: "invoice-parsing",
    name: "Invoice Parser",
    description: "Extract vendor details, line items, totals, and dates from invoices.",
    buildFields: () => [
      {
        id: uid(),
        name: "invoice_number",
        type: "string",
        description: "The invoice number or ID",
        required: true,
      },
      {
        id: uid(),
        name: "invoice_date",
        type: "date",
        description: "The date the invoice was issued",
        required: true,
      },
      {
        id: uid(),
        name: "due_date",
        type: "date",
        description: "Payment due date",
      },
      {
        id: uid(),
        name: "vendor_name",
        type: "string",
        description: "Name of the vendor or supplier",
        required: true,
      },
      {
        id: uid(),
        name: "vendor_address",
        type: "address",
        description: "Full address of the vendor",
      },
      {
        id: uid(),
        name: "bill_to",
        type: "string",
        description: "Name of the person or company being billed",
      },
      {
        id: uid(),
        name: "po_number",
        type: "string",
        description: "Purchase order number, if present",
      },
      {
        id: uid(),
        name: "line_items",
        type: "table",
        description: "Individual line items on the invoice",
        columns: [
          {
            id: uid(),
            name: "description",
            type: "string",
            description: "Item or service description",
          },
          {
            id: uid(),
            name: "quantity",
            type: "number",
            description: "Quantity of the item",
          },
          {
            id: uid(),
            name: "unit_price",
            type: "decimal",
            description: "Price per unit",
          },
          {
            id: uid(),
            name: "amount",
            type: "decimal",
            description: "Total amount for this line item",
          },
        ],
      } as SchemaField,
      {
        id: uid(),
        name: "subtotal",
        type: "decimal",
        description: "Subtotal before tax",
      },
      {
        id: uid(),
        name: "tax",
        type: "decimal",
        description: "Tax amount",
      },
      {
        id: uid(),
        name: "total",
        type: "decimal",
        description: "Total amount due",
        required: true,
      },
      {
        id: uid(),
        name: "currency",
        type: "string",
        description: "Currency code (e.g. USD, EUR, GBP)",
      },
      {
        id: uid(),
        name: "payment_terms",
        type: "string",
        description: "Payment terms (e.g. Net 30, Due on receipt)",
      },
    ],
  },
  {
    id: "bank-statement-extraction",
    name: "Bank Statement Parser",
    description: "Extract transactions, balances, and account details from bank statements.",
    buildFields: () => [
      {
        id: uid(),
        name: "bank_name",
        type: "string",
        description: "Name of the bank or financial institution",
        required: true,
      },
      {
        id: uid(),
        name: "account_holder",
        type: "string",
        description: "Name of the account holder",
      },
      {
        id: uid(),
        name: "account_number",
        type: "string",
        description: "Account number (may be partially masked)",
      },
      {
        id: uid(),
        name: "statement_period_start",
        type: "date",
        description: "Start date of the statement period",
      },
      {
        id: uid(),
        name: "statement_period_end",
        type: "date",
        description: "End date of the statement period",
      },
      {
        id: uid(),
        name: "opening_balance",
        type: "decimal",
        description: "Account balance at the start of the statement period",
      },
      {
        id: uid(),
        name: "closing_balance",
        type: "decimal",
        description: "Account balance at the end of the statement period",
      },
      {
        id: uid(),
        name: "transactions",
        type: "table",
        description: "List of all transactions in the statement",
        columns: [
          {
            id: uid(),
            name: "date",
            type: "date",
            description: "Transaction date",
          },
          {
            id: uid(),
            name: "description",
            type: "string",
            description: "Transaction description or memo",
          },
          {
            id: uid(),
            name: "debit",
            type: "decimal",
            description: "Debit amount (money out), if applicable",
          },
          {
            id: uid(),
            name: "credit",
            type: "decimal",
            description: "Credit amount (money in), if applicable",
          },
          {
            id: uid(),
            name: "balance",
            type: "decimal",
            description: "Running balance after this transaction",
          },
        ],
      } as SchemaField,
      {
        id: uid(),
        name: "total_debits",
        type: "decimal",
        description: "Sum of all debit transactions",
      },
      {
        id: uid(),
        name: "total_credits",
        type: "decimal",
        description: "Sum of all credit transactions",
      },
      {
        id: uid(),
        name: "currency",
        type: "string",
        description: "Currency code (e.g. USD, EUR, GBP)",
      },
    ],
  },
]

export function getTemplateById(id: string): ParserTemplate | undefined {
  return parserTemplates.find((t) => t.id === id)
}

export function getAllTemplateIds(): string[] {
  return parserTemplates.map((t) => t.id)
}
