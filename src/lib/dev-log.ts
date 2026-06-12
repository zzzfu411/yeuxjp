export function warnInDevelopment(message: string, ...args: unknown[]) {
  if (process.env.NODE_ENV !== "development") return
  console.warn(message, ...args)
}
