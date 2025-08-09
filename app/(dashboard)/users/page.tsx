"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Card, Drawer, Form, Input, Modal, Space, Switch, Table, Tag, Typography, message, Select } from "antd"
import { usersApi, rolesApi } from "@/shared/api/endpoints"
import { ExclamationCircleOutlined, KeyOutlined, PlusOutlined } from "@ant-design/icons"

type UserRead = {
  id: string
  email: string | null
  phone: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  is_active: boolean
  is_verified: boolean
  permissions?: string[] | null
  memberships?: any[] | null
}
type RoleRead = { id: number; name: string; description?: string | null }

const { Title, Text } = Typography
const { confirm } = Modal

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<UserRead[]>([])
  const [roles, setRoles] = useState<RoleRead[]>([])
  const [search, setSearch] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<UserRead | null>(null)
  const [form] = Form.useForm()
  const [pwdForm] = Form.useForm()
  const [roleForm] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await usersApi.list()
      setData(data)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить пользователей")
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const { data } = await rolesApi.list()
      setRoles(data as any)
    } catch {}
  }

  useEffect(() => {
    load()
    loadRoles()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const s = search.toLowerCase()
    return data.filter((u) =>
      [u.email, u.phone, u.username, u.first_name, u.last_name, u.id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    )
  }, [data, search])

  const openEdit = (u: UserRead) => {
    setCurrent(u)
    form.setFieldsValue({
      email: u.email || "",
      phone: u.phone || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      username: u.username || "",
      is_active: u.is_active,
      is_verified: u.is_verified,
    })
    setOpen(true)
  }

  const saveUser = async () => {
    const v = await form.validateFields()
    await usersApi.update(current!.id, v)
    message.success("Пользователь обновлен")
    setOpen(false)
    await load()
  }

  const resetPassword = async (u: UserRead) => {
    pwdForm.resetFields()
    Modal.confirm({
      title: "Сброс пароля",
      icon: <KeyOutlined />,
      content: (
        <Form form={pwdForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="Новый пароль"
            rules={[
              { required: true, message: "Введите новый пароль" },
              { min: 8, message: "Минимум 8 символов" },
            ]}
          >
            <Input.Password placeholder="Новый пароль" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const v = await pwdForm.validateFields()
        await usersApi.resetPassword(u.id, v.new_password)
        message.success("Пароль сброшен")
      },
    })
  }

  const addRole = async (u: UserRead) => {
    roleForm.resetFields()
    Modal.confirm({
      title: "Добавить роль пользователю",
      icon: <PlusOutlined />,
      content: (
        <Form form={roleForm} layout="vertical">
          <Form.Item name="role_id" label="Роль" rules={[{ required: true, message: "Выберите роль" }]}>
            <Select
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
              placeholder="Выберите роль"
              showSearch
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const v = await roleForm.validateFields()
        await usersApi.addRole(u.id, v.role_id)
        message.success("Роль добавлена")
        await load()
      },
    })
  }

  const removeUser = (u: UserRead) => {
    confirm({
      title: "Удалить пользователя?",
      icon: <ExclamationCircleOutlined />,
      content: "Действие необратимо.",
      okButtonProps: { danger: true },
      onOk: async () => {
        await usersApi.delete(u.id)
        message.success("Пользователь удален")
        await load()
      },
    })
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Пользователи
          </Title>
          <Text type="secondary">Управление пользователями, ролями и доступом</Text>
        </div>
        <Input.Search
          placeholder="Поиск по email, телефону, имени..."
          onSearch={(v) => setSearch(v)}
          allowClear
          className="max-w-[320px]"
        />
      </div>

      <Card>
        <Table<UserRead>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: "ID", dataIndex: "id", width: 220, ellipsis: true },
            { title: "Email", dataIndex: "email" },
            { title: "Телефон", dataIndex: "phone" },
            { title: "Имя", render: (_, r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() || "-" },
            {
              title: "Статус",
              render: (_, r) => (
                <Space>
                  <Tag color={r.is_active ? "green" : "red"}>{r.is_active ? "Активен" : "Неактивен"}</Tag>
                  <Tag color={r.is_verified ? "green" : "orange"}>{r.is_verified ? "Проверен" : "Не проверен"}</Tag>
                </Space>
              ),
            },
            {
              title: "Действия",
              fixed: "right",
              width: 320,
              render: (_, r) => (
                <Space wrap>
                  <Button onClick={() => openEdit(r)}>Изменить</Button>
                  <Button icon={<KeyOutlined />} onClick={() => resetPassword(r)}>
                    Сброс пароля
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={() => addRole(r)}>
                    Роль
                  </Button>
                  <Button danger onClick={() => removeUser(r)}>
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
        title="Редактирование пользователя"
        open={open}
        onClose={() => setOpen(false)}
        width={Math.min(520, typeof window !== "undefined" ? window.innerWidth - 40 : 520)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="primary" onClick={saveUser}>
              Сохранить
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="email" label="Email">
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Телефон">
            <Input placeholder="+79998887766" />
          </Form.Item>
          <Form.Item name="username" label="Логин">
            <Input />
          </Form.Item>
          <Form.Item name="first_name" label="Имя">
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Фамилия">
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="is_active" label="Активен" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="is_verified" label="Проверен" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </Space>
  )
}
