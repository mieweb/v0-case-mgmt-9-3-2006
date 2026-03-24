// Debug utility for conditional logging
const DEBUG_KEY = "v0_debug_mode"

export const isDebugMode = (): boolean => {
  if (typeof window === "undefined") return false
  return localStorage.getItem(DEBUG_KEY) === "true"
}

export const setDebugMode = (enabled: boolean): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(DEBUG_KEY, enabled.toString())
}

export const debug = (...args: any[]): void => {
  if (isDebugMode()) {
    console.log("[v0]", ...args)
  }
}
