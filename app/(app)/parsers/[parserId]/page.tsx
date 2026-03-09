import { ParserDetailPage } from "@/components/extractor/parsers/ParserDetailPage"

export default function ParserPage({
  params,
  searchParams,
}: {
  params: { parserId: string }
  searchParams: { onboarding?: string }
}) {
  return (
    <ParserDetailPage
      parserId={params.parserId}
      showOnboarding={searchParams.onboarding === "true"}
    />
  )
}
