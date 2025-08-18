"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import "antd/dist/reset.css"
import {
  Layout,
  Menu,
  Typography,
  Dropdown,
  Space,
  Avatar,
  Button,
  Drawer,
  Input,
  Select,
  Divider,
  Grid,
  theme as antdTheme,
} from "antd"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ApartmentOutlined,
  ApiOutlined,
  AuditOutlined,
  BlockOutlined,
  DashboardOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons"
import UIProvider from "../providers/ui-provider" // Updated import
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchCompanies, setBaseUrl, setCompanyId, doLogout } from "@/store/auth/slice"

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid
const { Title, Text } = Typography

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: <Link href="/dashboard">Обзор</Link> },
  { type: "group", label: "Пользователи и организации" },
  { key: "/users", icon: <TeamOutlined />, label: <Link href="/users">Пользователи</Link> },
  { key: "/companies", icon: <ApartmentOutlined />, label: <Link href="/companies">Компании</Link> },
  { type: "group", label: "Роли и права" },
  { key: "/roles", icon: <SafetyCertificateOutlined />, label: <Link href="/roles">Роли</Link> },
  { key: "/permissions", icon: <AuditOutlined />, label: <Link href="/permissions">Права</Link> },
  { type: "group", label: "Безопасность и токены" },
  { key: "/admin/security", icon: <BlockOutlined />, label: <Link href="/admin/security">Безопасность</Link> },
  { key: "/admin/tokens", icon: <LockOutlined />, label: <Link href="/admin/tokens">Токены</Link> },
  { type: "group", label: "Интеграции" },
  { key: "/oauth/clients", icon: <ApiOutlined />, label: <Link href="/oauth/clients">OAuth клиенты</Link> },
  { key: "/integration/services", icon: <ProfileOutlined />, label: <Link href="/integration/services">Сервисы</Link> },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const screens = useBreakpoint()
  const [collapsed, setCollapsed] = useState(false)
  const { token } = antdTheme.useToken()
  const dispatch = useAppDispatch()
  const { user, baseUrl, companies, companyId } = useAppSelector((s) => s.auth)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!baseUrl) {
      router.replace("/login")
      return
    }
  }, [baseUrl]) // eslint-disable-line

  useEffect(() => {
    dispatch(fetchCompanies()).catch(() => {})
  }, []) // eslint-disable-line

  const selectedKeys = useMemo(() => {
    const candidates = menuItems
      .filter((i: any) => i?.key)
      .map((i: any) => i.key as string)
      .sort((a, b) => b.length - a.length)
    const match = candidates.find((k) => (pathname || "").startsWith(k))
    return match ? [match] : ["/dashboard"]
  }, [pathname])

  const menu:any = (
    <Menu
      items={[
        { key: "profile", label: <Link href="/profile">Профиль</Link>, icon: <UserOutlined /> },
        { type: "divider" },
        {
          key: "logout",
          label: <span onClick={() => dispatch(doLogout())}>Выход</span>,
          icon: <LogoutOutlined />,
          danger: true,
        },
      ]}
    />
  )

  return (
    <UIProvider>
      <Layout style={{ minHeight: "100dvh" }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          collapsedWidth={screens.xs ? 0 : 64}
          width={260}
          style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorSplit}` }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${token.colorSplit}` }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
            {!collapsed && (
              <div className="flex flex-col">
                <Title level={5} style={{ margin: 0 }}>
                  Auth-Service Admin
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Панель управления
                </Text>
              </div>
            )}
          </div>
          <Menu mode="inline" selectedKeys={selectedKeys} items={menuItems as any} style={{ border: "none" }} />
        </Sider>
        <Layout>
          <Header
            style={{
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorSplit}`,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-[45%]">
                <Input.Search
                  placeholder="Быстрый поиск (email, телефон, ID)..."
                  onSearch={(v) => {
                    if (!v) return
                    if ((pathname || "").startsWith("/admin/security")) {
                      router.push(`/admin/security?search=${encodeURIComponent(v)}`)
                    } else {
                      router.push(`/users?search=${encodeURIComponent(v)}`)
                    }
                  }}
                  allowClear
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  placeholder="Компания"
                  options={companies?.items?.map((c:any) => ({ label: c.name, value: c.id }))}
                  className="min-w-[180px]"
                  value={companyId}
                  onChange={(v) => dispatch(setCompanyId(v))}
                  allowClear
                />
                <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
                <Dropdown menu={menu} trigger={["click"]}>
                  <Space className="cursor-pointer">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span>{user?.email || user?.username || "Аккаунт"}</span>
                  </Space>
                </Dropdown>
              </div>
            </div>
          </Header>
          <Content style={{ background: token.colorBgLayout }}>
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </Content>
        </Layout>
      </Layout>

      <Drawer
        title="Настройки"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={Math.min(480, typeof window !== "undefined" ? window.innerWidth - 40 : 480)}
      >
        <Space direction="vertical" size="middle" className="w-full">
          <div>
            <Text strong>API Base URL</Text>
            <Input
              placeholder="https://api.example.com"
              value={baseUrl}
              onChange={(e) => dispatch(setBaseUrl(e.target.value))}
            />
          </div>
          <Divider />
          <div>
            <Text type="secondary">Сброс локальных данных (потребуется вход заново).</Text>
            <div className="mt-2 flex gap-8">
              <Button
                danger
                onClick={() => {
                  localStorage.clear()
                  window.location.href = "/login"
                }}
              >
                Сбросить локальные данные
              </Button>
            </div>
          </div>
        </Space>
      </Drawer>
    </UIProvider>
  )
}
