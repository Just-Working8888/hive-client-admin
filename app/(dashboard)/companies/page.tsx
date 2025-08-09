"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Card, Drawer, Form, Input, Modal, Space, Table, Tag, Typography, message } from "antd"
import { companiesApi } from "@/shared/api/endpoints"
import { ExclamationCircleOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons"

type CompanyRead = {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}
type MembershipRead = {
  id: string
  user_id: string
  company_id: string
  role_id: number
  status: string
  created_at: string | null
  updated_at: string | null
}

const { Title, Text } = Typography
const { confirm } = Modal

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CompanyRead[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<CompanyRead | null>(null)
  const [form] = Form.useForm()
  const [membersOpen, setMembersOpen] = useState(false)
  const [members, setMembers] = useState<MembershipRead[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await companiesApi.list()
      setData(data as any)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить компании")
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
      [c.name, c.description, c.id].filter(Boolean).some((v) => String(v).toLowerCase().includes(s)),
    )
  }, [data, search])

  const openCreate = () => {
    setCurrent(null)
    form.resetFields()
    setOpen(true)
  }
  const openEdit = (c: CompanyRead) => {
    setCurrent(c)
    form.setFieldsValue({ name: c.name, description: c.description || "" })
    setOpen(true)
  }

  const saveCompany = async () => {
    const v = await form.validateFields()
    if (current) {
      await companiesApi.update(current.id, v)
      message.success("Компания обновлена")
    } else {
      await companiesApi.create(v)
      message.success("Компания создана")
    }
    setOpen(false)
    await load()
  }

  const removeCompany = (c: CompanyRead) => {
    confirm({
      title: "Удалить компанию?",
      icon: <ExclamationCircleOutlined />,
      content: "Действие необратимо.",
      okButtonProps: { danger: true },
      onOk: async () => {
        await companiesApi.delete(c.id)
        message.success("Компания удалена")
        await load()
      },
    })
  }

  const openMembers = async (c: CompanyRead) => {
    const { data } = await companiesApi.memberships(c.id)
    setMembers(data as any)
    setMembersOpen(true)
    setCurrent(c)
  }

  const approveMembership = async (m: MembershipRead) => {
    await companiesApi.approveMembership(m.company_id, m.id)
    message.success("Участие одобрено")
    await openMembers(current!)
  }
  const dismissMembership = async (m: MembershipRead) => {
    await companiesApi.dismissMembership(m.company_id, m.id)
    message.success("Участие отклонено")
    await openMembers(current!)
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Компании
          </Title>
          <Text type="secondary">Управление компаниями и участниками</Text>
        </div>
        <div className="flex items-center gap-2">
          <Input.Search
            placeholder="Поиск компании"
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
        <Table<CompanyRead>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: "ID", dataIndex: "id", width: 220, ellipsis: true },
            { title: "Название", dataIndex: "name" },
            { title: "Описание", dataIndex: "description" },
            { title: "Создана", dataIndex: "created_at" },
            {
              title: "Действия",
              fixed: "right",
              width: 320,
              render: (_, r) => (
                <Space wrap>
                  <Button onClick={() => openEdit(r)}>Изменить</Button>
                  <Button icon={<TeamOutlined />} onClick={() => openMembers(r)}>
                    Участники
                  </Button>
                  <Button danger onClick={() => removeCompany(r)}>
                    Удалить
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 900 }}
        />
      </Card>

      <Drawer
        title={current ? "Изменить компанию" : "Создать компанию"}
        open={open}
        onClose={() => setOpen(false)}
        width={Math.min(520, typeof window !== "undefined" ? window.innerWidth - 40 : 520)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="primary" onClick={saveCompany}>
              Сохранить
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="ООО Ромашка" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={4} placeholder="Краткое описание" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={`Участники: ${current?.name || ""}`}
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        width={Math.min(720, typeof window !== "undefined" ? window.innerWidth - 40 : 720)}
      >
        <Table<MembershipRead>
          rowKey="id"
          dataSource={members}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "User ID", dataIndex: "user_id" },
            { title: "Role ID", dataIndex: "role_id" },
            {
              title: "Статус",
              dataIndex: "status",
              render: (v) => <Tag color={v === "active" ? "green" : v === "pending" ? "orange" : "default"}>{v}</Tag>,
            },
            {
              title: "Действия",
              render: (_, m) => (
                <Space>
                  <Button onClick={() => approveMembership(m)}>Одобрить</Button>
                  <Button danger onClick={() => dismissMembership(m)}>
                    Отклонить
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Drawer>
    </Space>
  )
}
