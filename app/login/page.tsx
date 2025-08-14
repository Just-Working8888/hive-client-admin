"use client"

import { use, useEffect, useMemo, useState } from "react"
import { Card, Form, Input, Button, Typography, Divider, Alert, Space, Checkbox } from "antd"
import Link from "next/link"
import { LockOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons"
import { useAppDispatch, useAppSelector } from "@/store"
import { loginWithPassword, setBaseUrl, setClientId, setClientSecret, setUseOAuthTokenLogin } from "@/store/auth/slice"

const { Title, Text } = Typography

export default function Page() {
  const dispatch = useAppDispatch()
  const { accessToken, baseUrl, clientId, clientSecret, useOAuthTokenLogin, error } = useAppSelector((s) => s.auth)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  
  useEffect(() => {
    // if (accessToken || (!useOAuthTokenLogin && baseUrl)) {      
    // if (accessToken) { 
    //   window.location.href = "/dashboard"
    // }
  }, [accessToken, useOAuthTokenLogin, baseUrl])

  const canUseOAuth = useMemo(() => Boolean(clientId && clientSecret), [clientId, clientSecret])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await dispatch(loginWithPassword({ username: values.username, password: values.password })).unwrap()
      window.location.href = "/dashboard"
    } catch {
      // error handled by slice; show alert via below
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10 bg-[rgb(245,247,250)]">
      <Card
        className="w-full max-w-md"
        // bordered={false}
        style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.08)", borderRadius: 16, border: "none" }}
      >
        <Space direction="vertical" size={16} className="w-full">
          <div className="text-center">
            <Title level={3} style={{ marginBottom: 8 }}>
              Панель управления
            </Title>
            <Text type="secondary">Войдите, чтобы продолжить</Text>
          </div>

          {error ? <Alert type="error" showIcon message={error} /> : null}

          <Form layout="vertical" form={form} initialValues={{ username: "", password: "" }} onFinish={onFinish}>
            <Form.Item
              name="username"
              label="Email или телефон"
              rules={[{ required: true, message: "Введите имя пользователя" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="user@example.com" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Пароль" rules={[{ required: true, message: "Введите пароль" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Divider />

            <Form.Item label="Настройки подключения">
              <Space direction="vertical" className="w-full">
                <Input
                  size="large"
                  prefix={<SettingOutlined />}
                  placeholder="https://api.example.com"
                  value={baseUrl}
                  onChange={(e) => dispatch(setBaseUrl(e.target.value))}
                />
              <Checkbox
  checked={useOAuthTokenLogin}
  onChange={(e) => dispatch(setUseOAuthTokenLogin(e.target.checked))}
>
  Использовать OAuth /oauth/token (рекомендуется)
</Checkbox>
                {useOAuthTokenLogin && (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <Input
                      size="large"
                      placeholder="client_id"
                      value={clientId || ""}
                      onChange={(e) => dispatch(setClientId(e.target.value || undefined))}
                    />
                    <Input.Password
                      size="large"
                      placeholder="client_secret"
                      value={clientSecret || ""}
                      onChange={(e) => dispatch(setClientSecret(e.target.value || undefined))}
                    />
                  </div>
                )}
              </Space>
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ borderRadius: 8 }}>
              Войти
            </Button>
          </Form>

          <Divider />
          <div className="text-center">
            <Text type="secondary">
              Нужна помощь? Откройте тикет поддержки:{" "}
              <Link target="_blank" href="https://vercel.com/help">
                vercel.com/help
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
