// Lightweight className utility without external deps
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | ClassDictionary
  | ClassArray

interface ClassDictionary {
  [id: string]: any
}

interface ClassArray extends Array<ClassValue> {}

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = []
  const push = (val: ClassValue) => {
    if (!val) return
    if (typeof val === "string" || typeof val === "number") {
      if (String(val).trim()) classes.push(String(val))
      return
    }
    if (Array.isArray(val)) {
      for (const v of val) push(v)
      return
    }
    if (typeof val === "object") {
      for (const [k, v] of Object.entries(val)) if (v) classes.push(k)
      return
    }
  }

  for (const v of inputs) push(v)
  return classes.join(" ")
}
