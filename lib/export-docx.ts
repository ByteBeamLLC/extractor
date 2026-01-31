export async function downloadFieldAsDocx(html: string, fileName: string): Promise<void> {
  const response = await fetch("/api/export/docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, fileName }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(err.error || "Failed to export DOCX")
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${fileName.replace(/[^a-z0-9_-]/gi, "_")}.docx`
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
