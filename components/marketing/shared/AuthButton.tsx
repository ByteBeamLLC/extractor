import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"

interface AuthButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  children: React.ReactNode
  showArrow?: boolean
}

export function AuthButton({
  variant = "default",
  size = "lg",
  className,
  children,
  showArrow = false,
}: AuthButtonProps) {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a href={`${APP_URL}/dashboard`}>
        {children}
        {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
      </a>
    </Button>
  )
}
