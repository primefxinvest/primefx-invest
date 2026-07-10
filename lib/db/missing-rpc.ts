/** Detect PostgREST "function not found" errors for optional RPC fallbacks. */
export function isMissingDbFunctionError(message: string | undefined): boolean {
  return Boolean(message?.includes('Could not find the function'))
}
