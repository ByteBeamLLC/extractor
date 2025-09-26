"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RoiModalProps {
  open: boolean
  stage: "calc" | "result"
  onOpenChange: (open: boolean) => void
  docsPerMonth: string
  onDocsPerMonthChange: (value: string) => void
  timePerDoc: string
  onTimePerDocChange: (value: string) => void
  hourlyCost: string
  onHourlyCostChange: (value: string) => void
  onCalculate: () => void
  totalHoursSaved: number
  monthlyDollarSavings: number | null
  annualDollarSavings: number | null
  bookingUrl: string
}

export function RoiModal({
  open,
  stage,
  onOpenChange,
  docsPerMonth,
  onDocsPerMonthChange,
  timePerDoc,
  onTimePerDocChange,
  hourlyCost,
  onHourlyCostChange,
  onCalculate,
  totalHoursSaved,
  monthlyDollarSavings,
  annualDollarSavings,
  bookingUrl,
}: RoiModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {stage === "calc"
              ? "You just processed 1 document. What if you could automate the next 5 steps?"
              : "Your estimated savings"}
          </DialogTitle>
          <DialogDescription>
            {stage === "calc"
              ? "Estimate how much time and money full workflow automation could save each month."
              : "These savings are based on the numbers you entered in the calculator."}
          </DialogDescription>
        </DialogHeader>

        {stage === "calc" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Simple data extraction is just the start. The real power of ByteBeam is in automating the entire, multi-step process that
              follows—turning raw documents into decisions, actions, and results.
            </p>
            <p className="text-sm">Imagine a workflow that can:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li><span className="mr-1">✅</span><strong>Extract & Validate:</strong> Pull invoice data, then automatically validate it against purchase orders in your database and flag discrepancies.</li>
              <li><span className="mr-1">✅</span><strong>Analyze & Flag:</strong> Read a 50-page legal contract, identify all non-compliant clauses based on your custom rules, and generate a summary report.</li>
              <li><span className="mr-1">✅</span><strong>Route & Decide:</strong> Process an incoming trade compliance form, determine the correct regional office based on its contents, and forward it with a recommended action.</li>
            </ul>

            <div className="rounded-md border p-3" id="roi-calculator">
              <h3 className="font-medium">Find out the real cost of your <em>entire</em> manual workflow.</h3>
              <p className="text-sm text-muted-foreground">Enter your estimates below to see your potential savings.</p>
              <div className="mt-3 grid gap-3">
                <div>
                  <Label>1. Documents processed per month</Label>
                  <Input type="number" placeholder="e.g., 500" value={docsPerMonth} onChange={(event) => onDocsPerMonthChange(event.target.value)} />
                </div>
                <div>
                  <Label>2. Average time for the <em>full process</em> (in minutes)</Label>
                  <Input type="number" placeholder="e.g., 15" value={timePerDoc} onChange={(event) => onTimePerDocChange(event.target.value)} />
                  <p className="text-[11px] text-muted-foreground">Note: Include all steps, not just data entry.</p>
                </div>
                <div>
                  <Label>3. (Optional) Average hourly team cost ($)</Label>
                  <Input type="number" placeholder="e.g., 35" value={hourlyCost} onChange={(event) => onHourlyCostChange(event.target.value)} />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button id="calculate-btn" onClick={onCalculate}>
                  Calculate My Savings 📈
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3" id="roi-results">
            <h2 className="text-lg">
              You could save an estimated <strong>{totalHoursSaved} hours</strong> every month.
            </h2>
            {monthlyDollarSavings != null && annualDollarSavings != null && (
              <h3 className="text-base">
                That's around <strong>${monthlyDollarSavings.toLocaleString()}</strong> per month, or <strong>${annualDollarSavings.toLocaleString()}</strong> back in your budget every year.
              </h3>
            )}
            <p className="text-sm text-muted-foreground">
              Ready to claim that time back? Let's have a quick chat to map out the exact automation strategy to get you there.
            </p>
            <div className="flex items-center gap-3">
              <Button asChild>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="cta-button">
                  Book a 15-min Strategy Call
                </a>
              </Button>
              <small className="text-muted-foreground"><em>Your schedule is open to map this out</em></small>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
