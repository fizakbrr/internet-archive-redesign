"use client"

import { useSyncExternalStore } from "react"
import type { Hit } from "./ia/search.ts"

// Demo account: favorites live only in this browser (labeled as demo wherever shown).
const KEY = "ia-redesign-demo-favorites"
const EMPTY: Hit[] = []
let cache: { raw: string | null; list: Hit[] } = { raw: null, list: EMPTY }
const listeners = new Set<() => void>()

function read(): Hit[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // Storage blocked (private mode, settings): behave as empty.
  }
  if (raw !== cache.raw) {
    let list: Hit[] = EMPTY
    try {
      list = raw ? (JSON.parse(raw) as Hit[]) : EMPTY
    } catch {}
    cache = { raw, list: Array.isArray(list) ? list : EMPTY }
  }
  return cache.list
}

function write(list: Hit[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => e.key === KEY && cb()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY)
  return {
    list,
    has: (id: string) => list.some((h) => h.id === id),
    toggle: (hit: Hit) => write(list.some((h) => h.id === hit.id) ? list.filter((h) => h.id !== hit.id) : [hit, ...list]),
    remove: (id: string) => write(list.filter((h) => h.id !== id)),
  }
}
