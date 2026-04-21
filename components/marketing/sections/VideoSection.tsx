import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_URL } from "@/lib/config"

export function VideoSection() {
  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Watch: Document to Structured Data in Seconds
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          See how Parsli turns a real invoice into clean, structured data — no templates, no code.
        </p>
        <div className="rounded-2xl overflow-hidden shadow-2xl border">
          <video
            src="/videos/parsli-demo.mp4"
            autoPlay
            muted
            loop
            controls
            playsInline
            className="w-full"
          />
        </div>
        <div className="mt-8">
          <Button size="lg" className="text-base px-8 h-11" asChild>
            <a
              href={`${APP_URL}/login?mode=signup`}
              data-cta-location="video_section"
              data-cta-name="Try It Yourself — Free"
              data-cta-destination="signup"
            >
              Try It Yourself — Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            No credit card required. Set up in under 2 minutes.
          </p>
        </div>
      </div>
    </section>
  )
}
