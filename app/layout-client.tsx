"use client"

import type React from "react"
import UIProvider from "./providers/ui-provider"
import StoreProvider from "./providers/store-provider"

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <StoreProvider>{children}</StoreProvider>
    </UIProvider>
  )
}
