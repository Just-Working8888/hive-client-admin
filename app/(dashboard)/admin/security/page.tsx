"use client"

import { useEffect, useState } from "react"
import { Button, Card, Input, Space, Table, Tabs, Tag, Typography, message, Modal } from "antd"
import { adminApi } from "@/shared/api/endpoints"
import { ExclamationCircleOutlined, StopOutlined, UnlockOutlined } from "@ant-design/icons"

type UserActivity = {
  user_id: string
  email?: string | null
  phone?: string | null
  last_login?: string | null
  login_count: number
  failed_login_count: number
  active_tokens: number
  locations: any[]
}
type SuspiciousActivity = {
  user_id: string
  email?: string | null
  phone?: string | null
  activity_type: string
  details: Record<string, any>
  timestamp: string
  id?: string
}

const { Title, Text } = Typography
const { confirm } = Modal

export default function Page({ searchParams }: { searchParams?: { search?: string } }) {
  const [activeTab, setActiveTab] = useState("users")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserActivity[]>([])
  const [sus, setSus] = useState<SuspiciousActivity[]>([])
  const [search, setSearch] = useState(searchParams?.search || "")

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.userActivities({ search: search || null, limit: 100 })
      setUsers(data as any)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить активности пользователей")
    } finally {
      setLoading(false)
    }
  }
  const loadSus = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.suspiciousActivities({ limit: 100 })
      setSus(data as any)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить подозрительные активности")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "users") loadUsers()
    else loadSus()
  }, [activeTab])

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const blockUser = async (user_id: string) => {
    confirm({
      title: "Заблокировать пользователя?",
      icon: <ExclamationCircleOutlined />,
      content: "Все токены будут отозваны.",
      okButtonProps: { danger: true },
      onOk: async () => {
        await adminApi.blockUser(user_id, "Violation")
        message.success("Пользователь заблокирован")
        await loadUsers()
      },
    })
  }
  const unblockUser = async (user_id: string) => {
    await adminApi.unblockUser(user_id)
    message.success("Пользователь разблокирован")
    await loadUsers()
  }
  const deleteActivity = async (activity_id: string) => {
    await adminApi.deleteSuspicious(activity_id)
    message.success("Запись удалена")
    await loadSus()
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Безопасность
          </Title>
          <Text type="secondary">Активности пользователей и подозрительные события</Text>
        </div>
        <Input.Search
          placeholder="Поиск (email или телефон)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={() => loadUsers()}
          allowClear
          className="max-w-[320px]"
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "users",
            label: "Пользователи",
            children: (
              <Card>
                <Table<UserActivity>
                  rowKey={(r) => r.user_id}
                  loading={loading}
                  dataSource={users}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  columns={[
                    { title: "User ID", dataIndex: "user_id", width: 240, ellipsis: true },
                    { title: "Email", dataIndex: "email" },
                    { title: "Телефон", dataIndex: "phone" },
                    { title: "Последний вход", dataIndex: "last_login" },
                    { title: "Входов", dataIndex: "login_count" },
                    { title: "Ошибок входа", dataIndex: "failed_login_count" },
                    { title: "Активные токены", dataIndex: "active_tokens" },
                    {
                      title: "Действия",
                      render: (_, r) => (
                        <Space>
                          <Button icon={<StopOutlined />} danger onClick={() => blockUser(r.user_id)}>
                            Заблокировать
                          </Button>
                          <Button icon={<UnlockOutlined />} onClick={() => unblockUser(r.user_id)}>
                            Разблокировать
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                  scroll={{ x: 1000 }}
                />
              </Card>
            ),
          },
          {
            key: "sus",
            label: "Подозрительные активности",
            children: (
              <Card>
                <Table<SuspiciousActivity>
                  rowKey={(r) => r.timestamp + "_" + r.user_id}
                  loading={loading}
                  dataSource={sus}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  columns={[
                    { title: "User ID", dataIndex: "user_id", width: 240, ellipsis: true },
                    { title: "Email", dataIndex: "email" },
                    { title: "Тип", dataIndex: "activity_type", render: (v) => <Tag color="orange">{v}</Tag> },
                    { title: "Время", dataIndex: "timestamp" },
                    { title: "Детали", render: (_, r) => <code className="text-xs">{JSON.stringify(r.details)}</code> },
                    {
                      title: "Действия",
                      render: (_, r) => (
                        <Button danger onClick={() => deleteActivity((r as any).id || r.timestamp)}>
                          Удалить
                        </Button>
                      ),
                    },
                  ]}
                  scroll={{ x: 1000 }}
                />
              </Card>
            ),
          },
        ]}
      />
    </Space>
  )
}
