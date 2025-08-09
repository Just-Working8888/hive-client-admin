"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Card, Drawer, Form, Input, Modal, Space, Table, Typography, message } from "antd"
import { permissionsApi } from "@/shared/api/endpoints"
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons"

type PermissionRead = { id: number; code: string; description?: string | null }

const { Title, Text } = Typography
const { confirm } = Modal

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PermissionRead[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<PermissionRead | null>(null)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await permissionsApi.list()
      setData(data as any)
    } catch (e: any) {
      message.error(e.message || "Не удалось загрузить права")
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
    return data.filter((p) =>
      [p.code, p.description, p.id].filter(Boolean).some((v) => String(v).toLowerCase().includes(s)),
    )
  }, [data, search])

  const openCreate = () => {
    setCurrent(null)
    form.resetFields()
    setOpen(true)
  }
  const openEdit = (p: PermissionRead) => {
    setCurrent(p)
    form.setFieldsValue({ name: "", code: p.code, description: p.description || "" })
    setOpen(true)
  }

  const save = async () => {
    const v = await form.validateFields()
    if (current) {
      await permissionsApi.patch(current.id, v)
      message.success("Право обновлено")
    } else {
      await permissionsApi.create(v)
      message.success("Право создано")
    }
    setOpen(false)
    await load()
  }

  const remove = (p: PermissionRead) => {
    confirm({
      title: "Удалить право?",
      icon: <ExclamationCircleOutlined />,
      okButtonProps: { danger: true },
      onOk: async () => {
        await permissionsApi.delete(p.id)
        message.success("Право удалено")
        await load()
      },
    })
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Права
          </Title>
          <Text type="secondary">Управление правами доступа</Text>
        </div>
        <div className="flex items-center gap-2">
          <Input.Search placeholder="Поиск права" onSearch={(v) => setSearch(v)} allowClear className="max-w-[280px]" />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Создать
          </Button>
        </div>
      </div>

      <Card>
        <Table<PermissionRead>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: "ID", dataIndex: "id", width: 120 },
            { title: "Код", dataIndex: "code" },
            { title: "Описание", dataIndex: "description" },
            {
              title: "Действия",
              fixed: "right",
              width: 220,
              render: (_, r) => (
                <Space wrap>
                  <Button onClick={() => openEdit(r)}>Изменить</Button>
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
        title={current ? "Изменить право" : "Создать право"}
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
          <Form.Item name="name" label="Название">
            <Input placeholder="Человеческое имя (необязательно)" />
          </Form.Item>
          <Form.Item name="code" label="Код" rules={[{ required: true, message: "Введите код" }]}>
            <Input placeholder="users:manage" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={4} placeholder="Описание права" />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  )
}
