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
  /**
   * CTA slot identifier for analytics. Pages are encouraged to pass a
   * specific label (e.g. "invoice_tool_hero"); when omitted, clicks still
   * track under "auth_button" and can be segmented via the `page_path`
   * event property that `CTATracker` attaches automatically.
   */
  ctaLocation?: string
}

export function AuthButton({
  variant = "default",
  size = "lg",
  className,
  children,
  showArrow = false,
  href,
  ctaLocation = "auth_button",
}: AuthButtonProps) {
  const target = href || "/dashboard"
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a
        href={`${APP_URL}${target}`}
        data-cta-location={ctaLocation}
        data-cta-destination="signup"
      >
        {children}
        {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
      </a>
    </Button>
  )
}
