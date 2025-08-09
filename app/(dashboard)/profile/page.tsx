"use client"

import { useEffect, useState } from "react"
import { Card, Descriptions, Typography, Skeleton, message } from "antd"
import { authApi } from "@/shared/api/endpoints"

const { Title } = Typography

export default function Page() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await authApi.me()
        setData(data)
      } catch (e: any) {
        message.error(e?.message || "Не удалось загрузить профиль")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <Title level={3}>Профиль</Title>
      <Card>
        {loading ? (
          <Skeleton active />
        ) : (
          <Descriptions bordered column={1}>
            {Object.entries(data || {}).map(([k, v]) => (
              <Descriptions.Item key={k} label={k}>
                <code className="text-xs">{JSON.stringify(v)}</code>
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Card>
    </div>
  )
}
