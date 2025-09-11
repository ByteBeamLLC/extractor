"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export function AutomationNudge(props: {
  explore: boolean
  setExplore: (v: boolean) => void
  process: string
  setProcess: (v: string) => void
  volume: string
  setVolume: (v: string) => void
  successMetric: string
  setSuccessMetric: (v: string) => void
  onPanelOpened?: () => void
}) {
  const { explore, setExplore, process, setProcess, volume, setVolume, successMetric, setSuccessMetric, onPanelOpened } = props
  const [open, setOpen] = useState(false)

  return (
    <Card className="border bg-muted/40">
      <CardContent className="p-4">
        <button
          type="button"
          className="w-full text-left text-sm font-medium text-foreground/90"
          onClick={() => {
            const next = !open
            setOpen(next)
            if (next) onPanelOpened?.()
          }}
        >
          {open ? "▾" : "▸"} Curious about automating more than extraction?
        </button>

        {open && (
          <div className="mt-3 space-y-3 text-sm">
            <div className="grid gap-2">
              <MiniCard title="Scale beyond the free tool" body="Run large batches, connect drives/ERPs, add approvals & audit trail." />
              <MiniCard title="Tailored AI agents" body="Let an agent handle multi-step document work end-to-end (review, route, transform, validate)." />
              <MiniCard title="Control & compliance" body="Granular permissions, redaction, and on-prem/private cloud options." />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch id="explore" checked={explore} onCheckedChange={setExplore} />
              <Label htmlFor="explore" className="font-medium">I’m exploring automation for my team</Label>
              <span className="text-muted-foreground text-xs">(optional)</span>
            </div>

            {explore && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label>Which process are you considering?</Label>
                  <Input
                    value={process}
                    onChange={(e) => setProcess(e.target.value)}
                    placeholder="invoices · product labels · onboarding KYC · other"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Monthly volume?</Label>
                  <Select value={volume || undefined} onValueChange={setVolume}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under 1k">under 1k</SelectItem>
                      <SelectItem value="1–10k">1–10k</SelectItem>
                      <SelectItem value="10k+">10k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>What would “success” look like?</Label>
                  <Input
                    value={successMetric}
                    onChange={(e) => setSuccessMetric(e.target.value)}
                    placeholder="e.g., 80% faster cycle time, <2% error rate"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{body}</div>
    </div>
  )
}
