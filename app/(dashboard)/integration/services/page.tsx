"use client"

import { useState } from "react"
import { Button, Card, Form, Input, Space, Typography, message } from "antd"
import { integrationApi } from "@/shared/api/endpoints"

type ServiceIntegrationResponse = {
  client_id: string
  client_secret: string
  service_name: string
  integration_settings: Record<string, any>
}

const { Title, Text } = Typography

export default function Page() {
  const [form] = Form.useForm()
  const [resp, setResp] = useState<ServiceIntegrationResponse | null>(null)

  const submit = async () => {
    const v = await form.validateFields()
    const payload = {
      service_name: v.service_name,
      service_description: v.service_description || null,
      redirect_uris: (v.redirect_uris as string).split(/\s|,/).filter(Boolean),
      api_url: v.api_url || null,
      webhook_url: v.webhook_url || null,
    }
    const { data } = await integrationApi.registerService(payload)
    setResp(data)
    message.success("Сервис зарегистрирован")
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Регистрация сервиса
        </Title>
        <Text type="secondary">Создание OAuth клиента и выдача настроек интеграции</Text>
      </div>

      <Card
        title="Новый сервис"
        extra={
          <Button type="primary" onClick={submit}>
            Сохранить
          </Button>
        }
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="service_name"
            label="Название сервиса"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input placeholder="Hiveclient" />
          </Form.Item>
          <Form.Item name="service_description" label="Описание">
            <Input.TextArea rows={3} placeholder="Краткое описание" />
          </Form.Item>
          <Form.Item
            name="redirect_uris"
            label="Redirect URIs"
            rules={[{ required: true, message: "Укажите redirect URIs" }]}
          >
            <Input.TextArea rows={3} placeholder="https://app.example.com/callback" />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item name="api_url" label="API URL">
              <Input placeholder="https://api.service.com" />
            </Form.Item>
            <Form.Item name="webhook_url" label="Webhook URL">
              <Input placeholder="https://service.com/webhook" />
            </Form.Item>
          </div>
        </Form>
      </Card>

      {resp && (
        <Card title="Данные для интеграции">
          <Space direction="vertical" className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Text type="secondary">client_id</Text>
                <div className="font-mono">{resp.client_id}</div>
              </div>
              <div>
                <Text type="secondary">client_secret</Text>
                <div className="font-mono">{resp.client_secret}</div>
              </div>
            </div>
            <div>
              <Text type="secondary">integration_settings</Text>
              <pre className="text-xs overflow-auto bg-[rgb(247,249,252)] p-3 rounded-md">
                {JSON.stringify(resp.integration_settings, null, 2)}
              </pre>
            </div>
          </Space>
        </Card>
      )}
    </Space>
  )
}
