"use client"

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { storageKeys } from "@/shared/config/storage"
import type { UserRead, CompanyRead } from "@/entities/user/types"
import { authApi } from "@/shared/api/endpoints"
import type { RootState } from ".."

type AuthState = {
  baseUrl: string
  clientId?: string
  clientSecret?: string
  useOAuthTokenLogin: boolean
  accessToken?: string
  refreshToken?: string
  companyId?: string
  user?: UserRead
  companies: CompanyRead[]
  loading: boolean
  error?: string
}

const initialState: AuthState = {
  baseUrl: "https://apihiveclient.bigbee.su",
  clientId: typeof window !== "undefined" ? localStorage.getItem(storageKeys.clientId) || undefined : undefined,
  clientSecret: typeof window !== "undefined" ? localStorage.getItem(storageKeys.clientSecret) || undefined : undefined,
  useOAuthTokenLogin:
    typeof window !== "undefined"
      ? localStorage.getItem(storageKeys.useOAuth) === "1" || localStorage.getItem(storageKeys.useOAuth) === null
      : true,
  accessToken: typeof window !== "undefined" ? localStorage.getItem(storageKeys.accessToken) || undefined : undefined,
  refreshToken: typeof window !== "undefined" ? localStorage.getItem(storageKeys.refreshToken) || undefined : undefined,
  companyId: typeof window !== "undefined" ? localStorage.getItem(storageKeys.companyId) || undefined : undefined,
  companies: [],
  loading: false,
}

export const loginWithPassword = createAsyncThunk<
  void,
  { username: string; password: string },
  { state: RootState; rejectValue: string }
>("auth/loginWithPassword", async (payload, { getState, dispatch, rejectWithValue }) => {
  const s = getState().auth
  if (!s.baseUrl) return rejectWithValue("Укажите API base URL")
  try {
    if (s.useOAuthTokenLogin) {
      if (!s.clientId || !s.clientSecret) {
        return rejectWithValue("Укажите client_id и client_secret или отключите OAuth режим")
      }
      const resp = await authApi.loginOAuthPassword({
        client_id: s.clientId,
        client_secret: s.clientSecret,
        username: payload.username,
        password: payload.password,
      })
      const data = resp.data as any
      if (!data?.access_token) return rejectWithValue("Сервер не вернул access_token")
      dispatch(setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token ?? undefined }))
    } else {
      const resp = await authApi.loginForm({ username: payload.username, password: payload.password })
      const data = resp.data as any
      if (data?.access_token) {
        dispatch(setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token ?? undefined }))
      }
    }
    await dispatch(loadMe()).unwrap()
    await dispatch(fetchCompanies()).unwrap()
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.detail || e?.message || "Ошибка входа")
  }
})

export const loadMe = createAsyncThunk<UserRead | undefined, void, { rejectValue: string }>(
  "auth/loadMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.me()
      return data
    } catch {
      // Allow UI to continue; not authenticated or endpoint returns {}
      return undefined
    }
  },
)

export const fetchCompanies = createAsyncThunk<CompanyRead[], void, { rejectValue: string }>(
  "auth/fetchCompanies",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.companies()
      return data
    } catch (e: any) {
      return rejectWithValue(e?.message || "Не удалось загрузить компании")
    }
  },
)

export const doLogout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await authApi.logout()
    } catch {}
    dispatch(setTokens({ accessToken: undefined, refreshToken: undefined }))
    dispatch(setUser(undefined))
  },
)

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setBaseUrl(state, action: PayloadAction<string>) {
      state.baseUrl = action.payload
      if (typeof window !== "undefined") localStorage.setItem(storageKeys.baseUrl, action.payload)
    },
    setClientId(state, action: PayloadAction<string | undefined>) {
      state.clientId = action.payload
      if (typeof window !== "undefined") {
        if (action.payload) localStorage.setItem(storageKeys.clientId, action.payload)
        else localStorage.removeItem(storageKeys.clientId)
      }
    },
    setClientSecret(state, action: PayloadAction<string | undefined>) {
      state.clientSecret = action.payload
      if (typeof window !== "undefined") {
        if (action.payload) localStorage.setItem(storageKeys.clientSecret, action.payload)
        else localStorage.removeItem(storageKeys.clientSecret)
      }
    },
    setUseOAuthTokenLogin(state, action: PayloadAction<boolean>) {
      state.useOAuthTokenLogin = action.payload
      if (typeof window !== "undefined") localStorage.setItem(storageKeys.useOAuth, action.payload ? "1" : "0")
    },
    setTokens(state, action: PayloadAction<{ accessToken?: string; refreshToken?: string | undefined }>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      if (typeof window !== "undefined") {
        if (action.payload.accessToken) localStorage.setItem(storageKeys.accessToken, action.payload.accessToken)
        else localStorage.removeItem(storageKeys.accessToken)
        if (action.payload.refreshToken) localStorage.setItem(storageKeys.refreshToken, action.payload.refreshToken)
        else localStorage.removeItem(storageKeys.refreshToken)
      }
    },
    setCompanyId(state, action: PayloadAction<string | undefined>) {
      state.companyId = action.payload
      if (typeof window !== "undefined") {
        if (action.payload) localStorage.setItem(storageKeys.companyId, action.payload)
        else localStorage.removeItem(storageKeys.companyId)
      }
    },
    setUser(state, action: PayloadAction<UserRead | undefined>) {
      state.user = action.payload
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginWithPassword.pending, (state) => {
        state.loading = true
        state.error = undefined
      })
      .addCase(loginWithPassword.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(loginWithPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Ошибка входа"
      })
      .addCase(loadMe.fulfilled, (state, action) => {
        if (action.payload) state.user = action.payload
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.companies = action.payload
      })
  },
})

export const { setBaseUrl, setClientId, setClientSecret, setUseOAuthTokenLogin, setTokens, setCompanyId, setUser } =
  slice.actions

export default slice.reducer
