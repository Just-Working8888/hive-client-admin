"use client"

import { useEffect, useState } from "react"
import { Card, Col, Row, Statistic, Typography, Skeleton, Space, message } from "antd"
import { adminApi } from "@/shared/api/endpoints"
import {
  TeamOutlined,
  FireOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography

export default function Page() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await adminApi.securityStats()
        setStats(data)
      } catch (e: any) {
        message.error(e?.message || "Не удалось загрузить статистику")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div>
        <Title level={3} style={{ marginBottom: 8 }}>
          Обзор безопасности
        </Title>
        <Text type="secondary">Ключевые метрики активности пользователей и токенов</Text>
      </div>

      {loading ? (
        <Skeleton active />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Всего пользователей" value={stats?.total_users} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Активны (24ч)" value={stats?.active_users_24h} prefix={<FireOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Всего токенов" value={stats?.total_tokens} prefix={<LockOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Подозрительные активности"
                value={stats?.suspicious_activities}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Заблокированные пользователи"
                value={stats?.users_blocked}
                prefix={<UserSwitchOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  )
}
