"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Card, Drawer, Form, Input, Modal, Space, Table, Typography, message, Select } from "antd"
import { rolesApi, permissionsApi } from "@/shared/api/endpoints"
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons"

type RoleRead = { id: number; name: string; description?: string | null }
type PermissionRead = { id: number; code: string; description?: string | null }

const { Title, Text } = Typography
const { confirm } = Modal

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RoleRead[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<RoleRead | null>(null)
  const [form] = Form.useForm()

  const [perms, setPerms] = useState<PermissionRead[]>([])
  const [permsOpen, setPermsOpen] = useState(false)
  const [rolePerms, setRolePerms] = useState<PermissionRead[]>([])
  const [addPermId, setAddPermId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await rolesApi.list()
      setData(data as any)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить роли")
    } finally {
      setLoading(false)
    }
  }
  const loadPerms = async () => {
    try {
      const { data } = await permissionsApi.list()
      setPerms(data as any)
    } catch {}
  }

  useEffect(() => {
    load()
    loadPerms()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const s = search.toLowerCase()
    return data.filter((r) =>
      [r.name, r.description, r.id].filter(Boolean).some((v) => String(v).toLowerCase().includes(s)),
    )
  }, [data, search])

  const openCreate = () => {
    setCurrent(null)
    form.resetFields()
    setOpen(true)
  }
  const openEdit = (r: RoleRead) => {
    setCurrent(r)
    form.setFieldsValue({ name: r.name, description: r.description || "" })
    setOpen(true)
  }

  const save = async () => {
    const v = await form.validateFields()
    if (current) {
      await rolesApi.patch(current.id, v)
      message.success("Роль обновлена")
    } else {
      await rolesApi.create({ name: v.name, description: v.description || null })
      message.success("Роль создана")
    }
    setOpen(false)
    await load()
  }

  const remove = (r: RoleRead) => {
    confirm({
      title: "Удалить роль?",
      icon: <ExclamationCircleOutlined />,
      okButtonProps: { danger: true },
      onOk: async () => {
        await rolesApi.delete(r.id)
        message.success("Роль удалена")
        await load()
      },
    })
  }

  const openRolePerms = async (r: RoleRead) => {
    const { data } = await rolesApi.getPermissions(r.id)
    setCurrent(r)
    setRolePerms(data as any)
    setPermsOpen(true)
  }

  const addPerm = async () => {
    if (!current || !addPermId) return
    await rolesApi.addPermission(current.id, addPermId)
    message.success("Право добавлено")
    const { data } = await rolesApi.getPermissions(current.id)
    setRolePerms(data as any)
    setAddPermId(null)
  }
  const removePerm = async (perm: PermissionRead) => {
    if (!current) return
    await rolesApi.removePermission(current.id, perm.id)
    message.success("Право удалено")
    const { data } = await rolesApi.getPermissions(current.id)
    setRolePerms(data as any)
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Роли
          </Title>
          <Text type="secondary">Управление ролями и правами доступа</Text>
        </div>
        <div className="flex items-center gap-2">
          <Input.Search placeholder="Поиск роли" onSearch={(v) => setSearch(v)} allowClear className="max-w-[280px]" />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Создать
          </Button>
        </div>
      </div>

      <Card>
        <Table<RoleRead>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: "ID", dataIndex: "id", width: 120 },
            { title: "Название", dataIndex: "name" },
            { title: "Описание", dataIndex: "description" },
            {
              title: "Действия",
              fixed: "right",
              width: 320,
              render: (_, r) => (
                <Space wrap>
                  <Button onClick={() => openEdit(r)}>Изменить</Button>
                  <Button onClick={() => openRolePerms(r)}>Права</Button>
                  <Button danger onClick={() => remove(r)}>
                    Удалить
                  </Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 800 }}
        />
      </Card>

      <Drawer
        title={current ? "Изменить роль" : "Создать роль"}
        open={open}
        onClose={() => setOpen(false)}
        width={Math.min(520, typeof window !== "undefined" ? window.innerWidth - 40 : 520)}
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
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, message: "Введите название" }]}>
            <Input placeholder="Менеджер" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={4} placeholder="Описание роли" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={`Права для роли: ${current?.name || ""}`}
        open={permsOpen}
        onClose={() => setPermsOpen(false)}
        width={Math.min(680, typeof window !== "undefined" ? window.innerWidth - 40 : 680)}
      >
        <Space direction="vertical" className="w-full">
          <Space.Compact className="w-full">
            <Select
              className="w-full"
              placeholder="Добавить право"
              showSearch
              value={addPermId ?? undefined}
              onChange={(v) => setAddPermId(v)}
              options={perms
                .filter((p) => !rolePerms.some((rp) => rp.id === p.id))
                .map((p) => ({ label: `${p.code}${p.description ? ` — ${p.description}` : ""}`, value: p.id }))}
            />
            <Button type="primary" onClick={addPerm} disabled={!addPermId}>
              Добавить
            </Button>
          </Space.Compact>
          <Card>
            <Table<PermissionRead>
              rowKey="id"
              dataSource={rolePerms}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "ID", dataIndex: "id", width: 100 },
                { title: "Код", dataIndex: "code" },
                { title: "Описание", dataIndex: "description" },
                {
                  title: "Действия",
                  render: (_, p) => (
                    <Button danger onClick={() => removePerm(p)}>
                      Удалить
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      </Drawer>
    </Space>
  )
}
