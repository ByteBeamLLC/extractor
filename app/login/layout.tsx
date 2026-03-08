import { SupabaseProvider } from "@/components/providers/SupabaseProvider"

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseProvider initialSession={null}>
      {children}
    </SupabaseProvider>
  )
}
