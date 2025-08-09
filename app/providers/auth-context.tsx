import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react"
import { App as AntApp } from "antd"
import { api } from "@/shared/api/client"

type TokenResponse = {
  access_token: string
  token_type?: string
  expires_in?: number
  refresh_token?: string | null
  scope?: string | null
  id_token?: string | null
}
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
type CompanyRead = {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}
type SecurityStats = {
  total_users: number
  active_users_24h: number
  active_users_7d: number
  active_users_30d: number
  failed_logins_24h: number
  total_tokens: number
  users_with_tokens: number
  average_tokens_per_user: number
  users_blocked: number
  suspicious_activities: number
}

type AuthContextType = {
  baseUrl: string
  setBaseUrl: (url: string) => void
  clientId?: string
  clientSecret?: string
  setClientId: (v?: string) => void
  setClientSecret: (v?: string) => void
  useOAuthTokenLogin: boolean
  setUseOAuthTokenLogin: (v: boolean) => void
  accessToken?: string
  refreshToken?: string
  setTokens: (access?: string, refresh?: string | null) => void
  companyId?: string
  setCompanyId: (id?: string) => void
  user?: UserRead
  isAuthenticated: boolean
  loginWithPassword: (username: string, password: string) => Promise<void>
  logout: () => void
  apiFetch: <T = any>(path: string, query?: Record<string, any>) => Promise<T>
  loadMe: () => Promise<void>
  getCompanies: () => Promise<CompanyRead[]>
  getSecurityStats: () => Promise<SecurityStats>
}

const AuthContext = createContext<AuthContextType>({} as any)

const storageKeys = {
  baseUrl: "auth.baseUrl",
  accessToken: "auth.accessToken",
  refreshToken: "auth.refreshToken",
  companyId: "auth.companyId",
  clientId: "auth.clientId",
  clientSecret: "auth.clientSecret",
  useOAuth: "auth.useOAuth",
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { message, notification } = AntApp.useApp()
  const [baseUrl, setBaseUrlState] = useState<string>(typeof window !== "undefined" ? localStorage.getItem(storageKeys.baseUrl) || "" : "")
  const [clientId, setClientIdState] = useState<string | undefined>(typeof window !== "undefined" ? localStorage.getItem(storageKeys.clientId) || undefined : undefined)
  const [clientSecret, setClientSecretState] = useState<string | undefined>(typeof window !== "undefined" ? localStorage.getItem(storageKeys.clientSecret) || undefined : undefined)
  const [useOAuthTokenLogin, setUseOAuthTokenLoginState] = useState<boolean>(typeof window !== "undefined" ? (localStorage.getItem(storageKeys.useOAuth) === "1") : true)

  const [accessToken, setAccessToken] = useState<string | undefined>(typeof window !== "undefined" ? localStorage.getItem(storageKeys.accessToken) || undefined : undefined)
  const [refreshToken, setRefreshToken] = useState<string | undefined>(typeof window !== "undefined" ? localStorage.getItem(storageKeys.refreshToken) || undefined : undefined)
  const [companyId, setCompanyIdState] = useState<string | undefined>(typeof window !== "undefined" ? localStorage.getItem(storageKeys.companyId) || undefined : undefined)
  const [user, setUser] = useState<UserRead | undefined>(undefined)

  const refreshingRef = useRef<Promise<boolean> | null>(null)

  const isAuthenticated = useMemo(() => Boolean(accessToken) || !useOAuthTokenLogin, [accessToken, useOAuthTokenLogin])

  const setBaseUrl = (url: string) => {
    setBaseUrlState(url)
    if (typeof window !== "undefined") localStorage.setItem(storageKeys.baseUrl, url)
  }
  const setClientId = (v?: string) => {
    setClientIdState(v)
    if (typeof window !== "undefined") {
      if (v) localStorage.setItem(storageKeys.clientId, v)
      else localStorage.removeItem(storageKeys.clientId)
    }
  }
  const setClientSecret = (v?: string) => {
    setClientSecretState(v)
    if (typeof window !== "undefined") {
      if (v) localStorage.setItem(storageKeys.clientSecret, v)
      else localStorage.removeItem(storageKeys.clientSecret)
    }
  }
  const setUseOAuthTokenLogin = (v: boolean) => {
    setUseOAuthTokenLoginState(v)
    if (typeof window !== "undefined") localStorage.setItem(storageKeys.useOAuth, v ? "1" : "0")
  }
  const setTokens = (access?: string, refresh?: string | null) => {
    if (access) {
      setAccessToken(access)
      if (typeof window !== "undefined") localStorage.setItem(storageKeys.accessToken, access)
    } else {
      setAccessToken(undefined)
      if (typeof window !== "undefined") localStorage.removeItem(storageKeys.accessToken)
    }
    if (refresh !== undefined) {
      if (refresh) {
        setRefreshToken(refresh)
        if (typeof window !== "undefined") localStorage.setItem(storageKeys.refreshToken, refresh)
      } else {
        setRefreshToken(undefined)
        if (typeof window !== "undefined") localStorage.removeItem(storageKeys.refreshToken)
      }
    }
  }
  const setCompanyId = (id?: string) => {
    setCompanyIdState(id)
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(storageKeys.companyId, id)
      else localStorage.removeItem(storageKeys.companyId)
    }
  }

  const apiFetch = useCallback(
    async <T,>(path: string, query?: Record<string, any>): Promise<T> => {
      if (!baseUrl) throw new Error("API base URL не задан")
      const url = new URL((baseUrl || "").replace(/\/+$/, "") + "/" + path.replace(/^\/+/, ""))
      if (query) {
        Object.entries(query).forEach(([k, v]) => {
          if (v === undefined || v === null) return
          url.searchParams.set(k, String(v))
        })
      }

      try {
        const response = await api.get<T>(url.toString())
        return response.data
      } catch (error: any) {
        throw new Error("Ошибка запроса: " + error.message)
      }
    },
    [baseUrl]
  )

  const loginWithPassword = useCallback(
    async (username: string, password: string) => {
      if (!baseUrl) throw new Error("Укажите API base URL")
      if (useOAuthTokenLogin) {
        if (!clientId || !clientSecret) {
          throw new Error("Укажите client_id и client_secret для /oauth/token или отключите режим OAuth")
        }
        const { data } = await api.post<TokenResponse>("/oauth/token", new URLSearchParams({
          grant_type: "password",
          client_id: clientId,
          client_secret: clientSecret,
          username,
          password,
        }).toString())

        if (!data.access_token) throw new Error("Сервер не вернул access_token")
        setTokens(data.access_token, data.refresh_token ?? null)
        try {
          await loadMe() // populate user
        } catch { }
      } else {
        const { data } = await api.post<TokenResponse>("/login", new URLSearchParams({
          username,
          password,
        }).toString())

        if (data?.access_token) {
          setTokens(data.access_token, data?.refresh_token ?? null)
        }
        try {
          await loadMe() // populate user
        } catch { }
      }
      notification.success({ message: "Успешный вход" })
    },
    [baseUrl, clientId, clientSecret, useOAuthTokenLogin]
  )

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch { }
    setTokens(undefined, null)
    setUser(undefined)
    message.success("Вы вышли из системы")
    if (typeof window !== "undefined") window.location.href = "/login"
  }, [baseUrl])

  const loadMe = useCallback(async () => {
    try {
      const me = await apiFetch<UserRead>("/users/me")
      setUser(me)
    } catch (e) {
      // Swallow, may be not authorized yet
    }
  }, [apiFetch])

  const getCompanies = useCallback(async (): Promise<CompanyRead[]> => {
    return await apiFetch<CompanyRead[]>("/users/companies")
  }, [apiFetch])

  const getSecurityStats = useCallback(async () => {
    return await apiFetch<SecurityStats>("/api/v1/admin/admin/security/dashboard")
  }, [apiFetch])

  useEffect(() => {
    // Try load user on mount if token exists
    if (baseUrl && (accessToken || !useOAuthTokenLogin)) {
      loadMe()
    }
  }, [baseUrl]) // eslint-disable-line

  const value: AuthContextType = {
    baseUrl,
    setBaseUrl,
    clientId,
    clientSecret,
    setClientId,
    setClientSecret,
    useOAuthTokenLogin,
    setUseOAuthTokenLogin,
    accessToken,
    refreshToken,
    setTokens,
    companyId,
    setCompanyId,
    user,
    isAuthenticated,
    loginWithPassword,
    logout,
    apiFetch,
    loadMe,
    getCompanies,
    getSecurityStats,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
