"use client"
import LayoutClient from "../layout-client"
import type React from "react"

export default function Template({ children }: { children: React.ReactNode }) {
  return <LayoutClient>{children}</LayoutClient>
}
