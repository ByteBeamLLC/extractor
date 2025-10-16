import { DataExtractionPlatform } from "@/components/data-extraction-platform"
import { ENABLE_DASHBOARD } from "@/lib/workspace/featureFlags"
import { WorkspaceApp } from "@/components/workspace/WorkspaceApp"

export default function Home() {
  if (ENABLE_DASHBOARD) {
    return (
      <main className="min-h-screen bg-background">
        <WorkspaceApp />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <DataExtractionPlatform />
    </main>
  )
}
