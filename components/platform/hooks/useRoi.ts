"use client"

import { useCallback, useState } from "react"

type Stage = "calc" | "result"

export function useRoi() {
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState<Stage>("calc")
  const [docsPerMonth, setDocsPerMonth] = useState("")
  const [timePerDoc, setTimePerDoc] = useState("")
  const [hourlyCost, setHourlyCost] = useState("")
  const [totalHoursSaved, setTotalHoursSaved] = useState(0)
  const [monthlyDollarSavings, setMonthlyDollarSavings] = useState<number | null>(null)
  const [annualDollarSavings, setAnnualDollarSavings] = useState<number | null>(null)

  const open = useCallback(() => {
    setStage("calc")
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    try {
      localStorage.setItem("bb_roi_last_shown", String(Date.now()))
    } catch {}
  }, [])

  const recordSuccess = useCallback(() => {
    try {
      const current = Number.parseInt(localStorage.getItem("bb_success_count") || "0") || 0
      const next = current + 1
      localStorage.setItem("bb_success_count", String(next))
      if (next >= 3) {
        const lastShown = Number(localStorage.getItem("bb_roi_last_shown") || "0")
        const daysSince = lastShown ? (Date.now() - lastShown) / (1000 * 60 * 60 * 24) : Infinity
        if (daysSince >= 30) {
          setStage("calc")
          setIsOpen(true)
        }
      }
    } catch {}
  }, [])

  const calculate = useCallback(() => {
    const documents = Math.max(0, Number(docsPerMonth) || 0)
    const minutesPerDoc = Math.max(0, Number(timePerDoc) || 0)
    const hourly = Math.max(0, Number(hourlyCost) || 0)

    const minutes = documents * minutesPerDoc
    const hours = Math.round(minutes / 60)
    setTotalHoursSaved(hours)

    if (hourly > 0) {
      const monthly = hours * hourly
      setMonthlyDollarSavings(monthly)
      setAnnualDollarSavings(monthly * 12)
    } else {
      setMonthlyDollarSavings(null)
      setAnnualDollarSavings(null)
    }

    setStage("result")
  }, [docsPerMonth, timePerDoc, hourlyCost])

  return {
    isOpen,
    stage,
    docsPerMonth,
    timePerDoc,
    hourlyCost,
    totalHoursSaved,
    monthlyDollarSavings,
    annualDollarSavings,
    setDocsPerMonth,
    setTimePerDoc,
    setHourlyCost,
    calculate,
    open,
    close,
    recordSuccess,
  }
}
