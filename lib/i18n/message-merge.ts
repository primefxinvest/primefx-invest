type JsonObject = Record<string, unknown>

function isPlainObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

/** Deep-merge `override` onto `base`. Missing keys in override keep base values. */
export function deepMergeMessages<T extends JsonObject>(base: T, override: JsonObject): T {
  const result: JsonObject = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const existing = result[key]

    if (isPlainObject(value) && isPlainObject(existing)) {
      result[key] = deepMergeMessages(existing, value)
      continue
    }

    if (value !== undefined && value !== null) {
      result[key] = value
    }
  }

  return result as T
}
