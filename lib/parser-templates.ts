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
  {
    id: "freight-invoice",
    name: "Freight Invoice Parser",
    description:
      "Extract carrier charges, PRO numbers, surcharges, and shipment details from freight invoices.",
    buildFields: () => [
      {
        id: uid(),
        name: "carrier_name",
        type: "string",
        description: "Name of the freight carrier (e.g. XPO, FedEx Freight, ODFL)",
        required: true,
      },
      {
        id: uid(),
        name: "invoice_number",
        type: "string",
        description: "Carrier invoice number",
        required: true,
      },
      {
        id: uid(),
        name: "invoice_date",
        type: "date",
        description: "Date the invoice was issued",
      },
      {
        id: uid(),
        name: "pro_number",
        type: "string",
        description: "PRO tracking number for the shipment",
        required: true,
      },
      {
        id: uid(),
        name: "bol_number",
        type: "string",
        description: "Bill of lading number referenced on the invoice",
      },
      {
        id: uid(),
        name: "po_number",
        type: "string",
        description: "Purchase order number, if present",
      },
      {
        id: uid(),
        name: "ship_date",
        type: "date",
        description: "Date the shipment was picked up",
      },
      {
        id: uid(),
        name: "origin",
        type: "string",
        description: "Origin city and state (e.g. Chicago, IL)",
      },
      {
        id: uid(),
        name: "destination",
        type: "string",
        description: "Destination city and state (e.g. Dallas, TX)",
      },
      {
        id: uid(),
        name: "weight",
        type: "number",
        description: "Total shipment weight in pounds",
      },
      {
        id: uid(),
        name: "freight_class",
        type: "string",
        description: "NMFC freight classification (e.g. 50, 55, 70, 85, 100)",
      },
      {
        id: uid(),
        name: "line_haul_charge",
        type: "decimal",
        description: "Base line-haul freight charge",
      },
      {
        id: uid(),
        name: "fuel_surcharge",
        type: "decimal",
        description: "Fuel surcharge amount",
      },
      {
        id: uid(),
        name: "accessorial_charges",
        type: "table",
        description: "Accessorial and additional charges (detention, lumper, liftgate, etc.)",
        columns: [
          {
            id: uid(),
            name: "charge_type",
            type: "string",
            description: "Type of accessorial charge",
          },
          {
            id: uid(),
            name: "amount",
            type: "decimal",
            description: "Charge amount in USD",
          },
        ],
      } as SchemaField,
      {
        id: uid(),
        name: "total_charges",
        type: "decimal",
        description: "Total invoice amount",
        required: true,
      },
      {
        id: uid(),
        name: "payment_terms",
        type: "string",
        description: "Payment terms (e.g. Net 30, 2/10 Net 30)",
      },
      {
        id: uid(),
        name: "due_date",
        type: "date",
        description: "Payment due date",
      },
    ],
  },
  {
    id: "bill-of-lading",
    name: "Bill of Lading Parser",
    description:
      "Extract shipper, consignee, cargo details, and all 17 FMCSA-mandated fields from any BOL format.",
    buildFields: () => [
      {
        id: uid(),
        name: "bol_number",
        type: "string",
        description: "Bill of lading number",
        required: true,
      },
      {
        id: uid(),
        name: "pro_number",
        type: "string",
        description: "PRO tracking number assigned by the carrier",
      },
      {
        id: uid(),
        name: "shipper_name",
        type: "string",
        description: "Name of the shipper / sender company",
        required: true,
      },
      {
        id: uid(),
        name: "shipper_address",
        type: "address",
        description: "Full address of the shipper",
      },
      {
        id: uid(),
        name: "consignee_name",
        type: "string",
        description: "Name of the consignee / receiver company",
        required: true,
      },
      {
        id: uid(),
        name: "consignee_address",
        type: "address",
        description: "Full address of the consignee",
      },
      {
        id: uid(),
        name: "carrier_name",
        type: "string",
        description: "Name of the freight carrier",
      },
      {
        id: uid(),
        name: "ship_date",
        type: "date",
        description: "Date of shipment pickup",
      },
      {
        id: uid(),
        name: "line_items",
        type: "table",
        description: "Cargo line items with description, weight, class, and piece count",
        columns: [
          {
            id: uid(),
            name: "description",
            type: "string",
            description: "Description of goods",
          },
          {
            id: uid(),
            name: "weight",
            type: "number",
            description: "Weight in pounds",
          },
          {
            id: uid(),
            name: "pieces",
            type: "number",
            description: "Number of handling units",
          },
          {
            id: uid(),
            name: "freight_class",
            type: "string",
            description: "NMFC freight class",
          },
          {
            id: uid(),
            name: "nmfc_code",
            type: "string",
            description: "NMFC item number",
          },
        ],
      } as SchemaField,
      {
        id: uid(),
        name: "total_weight",
        type: "number",
        description: "Total shipment weight in pounds",
      },
      {
        id: uid(),
        name: "total_pieces",
        type: "number",
        description: "Total number of handling units",
      },
      {
        id: uid(),
        name: "special_instructions",
        type: "string",
        description: "Special handling instructions, delivery notes, or remarks",
      },
      {
        id: uid(),
        name: "declared_value",
        type: "decimal",
        description: "Declared value of the shipment, if present",
      },
    ],
  },
  {
    id: "commercial-invoice",
    name: "Commercial Invoice Parser",
    description:
      "Extract seller, buyer, line items, quantities, values, and HS codes from commercial invoices for customs.",
    buildFields: () => [
      {
        id: uid(),
        name: "invoice_number",
        type: "string",
        description: "Commercial invoice number",
        required: true,
      },
      {
        id: uid(),
        name: "invoice_date",
        type: "date",
        description: "Date the invoice was issued",
      },
      {
        id: uid(),
        name: "seller_name",
        type: "string",
        description: "Name of the seller / exporter company",
        required: true,
      },
      {
        id: uid(),
        name: "seller_address",
        type: "address",
        description: "Full address of the seller",
      },
      {
        id: uid(),
        name: "buyer_name",
        type: "string",
        description: "Name of the buyer / importer company",
        required: true,
      },
      {
        id: uid(),
        name: "buyer_address",
        type: "address",
        description: "Full address of the buyer",
      },
      {
        id: uid(),
        name: "country_of_origin",
        type: "string",
        description: "Country where goods were manufactured",
      },
      {
        id: uid(),
        name: "terms_of_sale",
        type: "string",
        description: "Incoterms (e.g. FOB, CIF, EXW, DDP)",
      },
      {
        id: uid(),
        name: "line_items",
        type: "table",
        description: "Itemized goods with quantities, unit prices, and HS codes",
        columns: [
          {
            id: uid(),
            name: "description",
            type: "string",
            description: "Description of goods",
          },
          {
            id: uid(),
            name: "hs_code",
            type: "string",
            description: "Harmonized System code for customs classification",
          },
          {
            id: uid(),
            name: "quantity",
            type: "number",
            description: "Quantity of items",
          },
          {
            id: uid(),
            name: "unit_price",
            type: "decimal",
            description: "Price per unit",
          },
          {
            id: uid(),
            name: "total_value",
            type: "decimal",
            description: "Total value for this line item",
          },
        ],
      } as SchemaField,
      {
        id: uid(),
        name: "total_value",
        type: "decimal",
        description: "Total declared value of all goods",
        required: true,
      },
      {
        id: uid(),
        name: "currency",
        type: "string",
        description: "Currency code (e.g. USD, EUR)",
      },
      {
        id: uid(),
        name: "shipping_method",
        type: "string",
        description: "Mode of transport (e.g. Ocean, Air, Ground)",
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
