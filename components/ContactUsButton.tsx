"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ContactUsModal } from "./ContactUsModal"

export function ContactUsButton({ source = "topbar" }: { source?: string }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <Button
        ref={btnRef}
        type="button"
        aria-label="Contact us"
        onClick={() => setOpen(true)}
        variant="outline"
        className="px-3 py-1.5 h-auto text-sm"
      >
        Contact Us
      </Button>
      <ContactUsModal open={open} onClose={() => setOpen(false)} returnFocusRef={btnRef} source={source} />
    </>
  )
}

