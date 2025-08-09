"use client"

import { useEffect, useState } from "react"
import { Button, Card, Col, Input, Modal, Row, Space, Statistic, Table, Typography, message } from "antd"
import { adminApi } from "@/shared/api/endpoints"
import { ExclamationCircleOutlined } from "@ant-design/icons"

type TokenStats = {
  total_tokens: number
  active_tokens: number
  expired_tokens: number
  revoked_tokens: number
  tokens_by_role: Record<string, number>
  tokens_by_permission: Record<string, number>
}
type TokenInfo = {
  token_fragment: string
  user_id: string
  email?: string | null
  created_at: string
  expires_at: string
  ip_address: string
  user_agent: string
  roles?: string[]
  permissions?: string[]
}

const { Title, Text } = Typography
const { confirm } = Modal

export default function Page() {
  const [stats, setStats] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState("")
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([])

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.tokenStats()
      setStats(data as any)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить статистику")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadStats()
  }, [])

  const loadUserTokens = async () => {
    if (!userId) return
    const { data } = await adminApi.userTokens(userId)
    setUserTokens(data as any)
  }

  const revokeUser = async () => {
    if (!userId) return
    await adminApi.revokeUserTokens(userId, "Admin requested")
    message.success("Токены пользователя отозваны")
    await loadUserTokens()
    await loadStats()
  }
  const revokeAll = async () => {
    confirm({
      title: "Отозвать все токены?",
      icon: <ExclamationCircleOutlined />,
      content: "Экстренная мера. Убедитесь в необходимости.",
      okButtonProps: { danger: true },
      onOk: async () => {
        await adminApi.revokeAllTokens("Emergency")
        message.success("Все токены отозваны")
        await loadStats()
      },
    })
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Управление токенами
        </Title>
        <Text type="secondary">Статистика и операции отзыва</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Всего" value={stats?.total_tokens || 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Активные" value={stats?.active_tokens || 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Истекшие" value={stats?.expired_tokens || 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Отозванные" value={stats?.revoked_tokens || 0} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Токены пользователя"
        extra={
          <Button danger onClick={revokeUser} disabled={!userId}>
            Отозвать все токены пользователя
          </Button>
        }
      >
        <Space direction="vertical" className="w-full">
          <Space.Compact className="w-full">
            <Input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
            <Button type="primary" onClick={loadUserTokens}>
              Загрузить
            </Button>
          </Space.Compact>
          <Table<TokenInfo>
            rowKey="token_fragment"
            dataSource={userTokens}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: "Фрагмент", dataIndex: "token_fragment" },
              { title: "Email", dataIndex: "email" },
              { title: "Выдан", dataIndex: "created_at" },
              { title: "Истекает", dataIndex: "expires_at" },
              { title: "IP", dataIndex: "ip_address" },
              { title: "User-Agent", dataIndex: "user_agent" },
            ]}
            scroll={{ x: 900 }}
          />
          <Button danger onClick={revokeAll}>
            Отозвать ВСЕ токены
          </Button>
        </Space>
      </Card>
    </Space>
  )
}
