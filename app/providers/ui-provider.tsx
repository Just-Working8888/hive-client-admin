"use client"

import type React from "react"
import { App as AntApp, ConfigProvider, theme as antdTheme } from "antd"

const primary = "#10b981"

export default function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: { colorPrimary: primary, borderRadius: 8 },
      }}
    >
      <AntApp message={{ maxCount: 2 }}>{children}</AntApp>
    </ConfigProvider>
  )
}
