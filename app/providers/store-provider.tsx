"use client"

import type React from "react"
import { useRef } from "react"
import { Provider } from "react-redux"
import { makeStore, type AppStore } from "@/store"

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }
  const store = makeStore()

  return <Provider store={store}>{children}</Provider>
}
