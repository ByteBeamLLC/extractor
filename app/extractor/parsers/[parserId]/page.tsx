"use client"

import { ParserDetailPage } from "@/components/extractor/parsers/ParserDetailPage"

export default function ParserPage({ params }: { params: { parserId: string } }) {
  return <ParserDetailPage parserId={params.parserId} />
}
