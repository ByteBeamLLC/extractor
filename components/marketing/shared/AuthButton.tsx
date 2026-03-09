import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"

interface AuthButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  children: React.ReactNode
  showArrow?: boolean
  /** Override the default /dashboard path (e.g. "/dashboard?template=invoice-parsing") */
  href?: string
}

export function AuthButton({
  variant = "default",
  size = "lg",
  className,
  children,
  showArrow = false,
  href,
}: AuthButtonProps) {
  const target = href || "/dashboard"
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a href={`${APP_URL}${target}`}>
        {children}
        {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
      </a>
    </Button>
  )
}
