"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Card, Drawer, Form, Input, Modal, Space, Table, Typography, message } from "antd"
import { oauthClientsApi } from "@/shared/api/endpoints"
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons"

type OAuthClientRead = {
  id: string
  client_id: string
  client_name: string
  redirect_uris: string
  scope?: string | null
  grant_types?: string | null
  response_types?: string | null
  token_endpoint_auth_method?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string | null
}

const { Title, Text } = Typography
const { confirm } = Modal

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OAuthClientRead[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<OAuthClientRead | null>(null)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await oauthClientsApi.list()
      setData(data as any)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить OAuth клиентов")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const s = search.toLowerCase()
    return data.filter((c) =>
      [c.client_name, c.client_id, c.redirect_uris, c.id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    )
  }, [data, search])

  const openCreate = () => {
    setCurrent(null)
    form.resetFields()
    setOpen(true)
  }
  const openEdit = async (c: OAuthClientRead) => {
    const { data } = await oauthClientsApi.get(c.id)
    const full = data as any
    setCurrent(full)
    form.setFieldsValue({
      client_name: full.client_name,
      redirect_uris: full.redirect_uris,
      scope: full.scope || "openid profile email",
      is_active: full.is_active,
    })
    setOpen(true)
  }

  const save = async () => {
    const v = await form.validateFields()
    if (current) {
      await oauthClientsApi.patch(current.id, v)
      message.success("Клиент обновлен")
    } else {
      await oauthClientsApi.create({
        client_name: v.client_name,
        redirect_uris: v.redirect_uris,
        scope: v.scope || "openid profile email",
      })
      message.success("Клиент создан")
    }
    setOpen(false)
    await load()
  }

  const remove = (c: OAuthClientRead) => {
    confirm({
      title: "Удалить OAuth клиента?",
      icon: <ExclamationCircleOutlined />,
      okButtonProps: { danger: true },
      onOk: async () => {
        await oauthClientsApi.delete(c.id)
        message.success("Клиент удален")
        await load()
      },
    })
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            OAuth клиенты
          </Title>
          <Text type="secondary">Управление OAuth клиентами</Text>
        </div>
        <div className="flex items-center gap-2">
          <Input.Search
            placeholder="Поиск клиента"
            onSearch={(v) => setSearch(v)}
            allowClear
            className="max-w-[280px]"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Создать
          </Button>
        </div>
      </div>

      <Card>
        <Table<OAuthClientRead>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: "ID", dataIndex: "id", width: 240, ellipsis: true },
            { title: "Client ID", dataIndex: "client_id", width: 200, ellipsis: true },
            { title: "Название", dataIndex: "client_name" },
            { title: "Redirect URIs", dataIndex: "redirect_uris" },
            { title: "Создан", dataIndex: "created_at" },
            {
              title: "Действия",
              render: (_, r) => (
                <Space>
                  <Button onClick={() => openEdit(r)}>Изменить</Button>
                  <Button danger onClick={() => remove(r)}>
                    Удалить
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Drawer
        title={current ? "Изменить клиента" : "Создать клиента"}
        open={open}
        onClose={() => setOpen(false)}
        width={Math.min(600, typeof window !== "undefined" ? window.innerWidth - 40 : 600)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="primary" onClick={save}>
              Сохранить
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="client_name" label="Название" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="My Service" />
          </Form.Item>
          <Form.Item
            name="redirect_uris"
            label="Redirect URIs"
            rules={[{ required: true, message: "Укажите redirect URI(ы)" }]}
            tooltip="Несколько URI обычно разделяются пробелом или запятой"
          >
            <Input.TextArea rows={4} placeholder="https://app.example.com/callback" />
          </Form.Item>
          <Form.Item name="scope" label="Scopes">
            <Input placeholder="openid profile email" />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  )
}
