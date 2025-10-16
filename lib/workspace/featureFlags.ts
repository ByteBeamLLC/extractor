export const ENABLE_DASHBOARD =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_ENABLE_DASHBOARD?.toLowerCase() === "true"
