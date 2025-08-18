import { api } from "./client"
import type { CompanyRead, UserRead } from "@/entities/user/types"

// Auth and profile
export const authApi = {
  loginOAuthPassword: (params: { client_id: string; client_secret: string; username: string; password: string }) => {
    const body = new URLSearchParams()
    body.set("grant_type", "password")
    body.set("client_id", params.client_id)
    body.set("client_secret", params.client_secret)
    body.set("username", params.username)
    body.set("password", params.password)
    return api.post("/oauth/token", body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
  },
  loginForm: (params: { username: string; password: string }) => {
    const body = new URLSearchParams()
    body.set("username", params.username)
    body.set("password", params.password)
    return api.post("/login", body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
  },
  logout: () => api.post("/auth/logout"),
  me: () => api.get<UserRead>("/users/me"),
  companies: () => api.get<CompanyRead[]>("/users/companies"),
}

type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pages: number;
  size: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
};
// Users
export const usersApi = {
  list: () => api.get<UserRead[]>("/users"),
  update: (userId: string, payload: Partial<UserRead>) => api.patch(`/users/${userId}`, payload),
  resetPassword: (userId: string, new_password: string) =>
    api.patch(`/users/${userId}/reset-password`, { new_password }),
  addRole: (userId: string, roleId: number) => api.patch(`/users/${userId}/add-role/${roleId}`),
  delete: (userId: string) => api.delete(`/users/${userId}`),
  getById: (userId: string) => api.get(`/users/${userId}`),
  listPaginated: (params?: string) => 
    api.get<PaginatedResponse<any>>(`/users${params ? `?${params}` : ''}`),
  searchSuggestions: (query: string, limit: number = 5) => 
    api.get<{id: string; email: string; name: string;
}[]>(`/users/search/suggestions?query=${encodeURIComponent(query)}&limit=${limit}`),
  
}

// Companies
export const companiesApi = {
  list: () => api.get<CompanyRead[]>("/users/companies"),
  getById: (id: string) => api.get<CompanyRead>(`/users/companies/${id}`),
  create: (payload: { name: string; description?: string | null }) => api.post("/users/companies", payload),
  update: (id: string, payload: { name?: string | null; description?: string | null }) =>
    api.patch(`/users/companies/${id}`, payload),
  delete: (id: string) => api.delete(`/users/companies/${id}`),
  memberships: (id: string) => api.get(`/users/companies/${id}/memberships`),
  approveMembership: (companyId: string, membershipId: string) =>
    api.patch(`/users/companies/${companyId}/memberships/${membershipId}/approve`),
  dismissMembership: (companyId: string, membershipId: string) =>
    api.patch(`/users/companies/${companyId}/memberships/${membershipId}/dismiss`),
  listPaginated: (params?: string) => 
    api.get<PaginatedResponse<any>>(`/users/companies${params ? `?${params}` : ''}`),
  searchSuggestions: (query: string, limit: number = 5) => 
    api.get<{id: string; email: string; name: string;
}[]>(`/users/search/suggestions?query=${encodeURIComponent(query)}&limit=${limit}`),
  
}

// Roles and permissions
export const rolesApi = {
  list: () => api.get("/roles"),
  get: (id: number) => api.get(`/roles/${id}`),
  create: (payload: { name: string; description?: string | null }) => api.post("/roles", payload),
  patch: (id: number, payload: { name?: string | null; description?: string | null }) =>
    api.patch(`/roles/${id}`, payload),
  delete: (id: number) => api.delete(`/roles/${id}`),
  getPermissions: (id: number) => api.get(`/roles/${id}/permissions`),
  addPermission: (roleId: number, permId: number) => api.post(`/roles/${roleId}/add-permission/${permId}`),
  removePermission: (roleId: number, permId: number) => api.delete(`/roles/${roleId}/remove-permission/${permId}`),
}

export const permissionsApi = {
  list: () => api.get("/permissions"),
  create: (payload: { name?: string | null; code: string; description?: string | null }) =>
    api.post("/permissions", payload),
  patch: (id: number, payload: { name?: string | null; code?: string | null; description?: string | null }) =>
    api.patch(`/permissions/${id}`, payload),
  delete: (id: number) => api.delete(`/permissions/${id}`),
}

// Admin security and tokens
export const adminApi = {
  securityStats: () => api.get("/api/v1/admin/admin/security/dashboard"),
  userActivities: (params: { skip?: number; limit?: number; search?: string | null }) =>
    api.get("/api/v1/admin/admin/security/users", { params }),
  suspiciousActivities: (params: { skip?: number; limit?: number }) =>
    api.get("/api/v1/admin/admin/security/suspicious-activities", { params }),
  blockUser: (userId: string, reason: string) =>
    api.post(`/api/v1/admin/admin/security/block-user/${userId}`, null, { params: { reason } }),
  unblockUser: (userId: string) => api.post(`/api/v1/admin/admin/security/unblock-user/${userId}`),
  deleteSuspicious: (activityId: string) =>
    api.delete(`/api/v1/admin/admin/security/suspicious-activity/${activityId}`),
  tokenStats: () => api.get("/api/v1/admin/admin/tokens/stats"),
  userTokens: (userId: string) => api.get(`/api/v1/admin/admin/tokens/users/${userId}`),
  revokeUserTokens: (userId: string, reason: string) =>
    api.post(`/api/v1/admin/admin/tokens/users/${userId}/revoke`, null, { params: { reason } }),
  revokeAllTokens: (reason: string) => api.post(`/api/v1/admin/admin/tokens/revoke-all`, null, { params: { reason } }),
}

// OAuth clients
export const oauthClientsApi = {
  list: () => api.get("/api/v1/admin/oauth/clients"),
  create: (payload: { client_name: string; redirect_uris: string; scope?: string | null }) =>
    api.post("/api/v1/admin/oauth/clients", payload),
  get: (idOrKey: string) => api.get(`/api/v1/admin/oauth/clients/${idOrKey}`),
  patch: (
    idOrKey: string,
    payload: {
      client_name?: string | null
      redirect_uris?: string | null
      scope?: string | null
      is_active?: boolean | null
    },
  ) => api.patch(`/api/v1/admin/oauth/clients/${idOrKey}`, payload),
  delete: (idOrKey: string) => api.delete(`/api/v1/admin/oauth/clients/${idOrKey}`),
}

// Integration services
export const integrationApi = {
  registerService: (payload: {
    service_name: string
    service_description?: string | null
    redirect_uris: string[]
    api_url?: string | null
    webhook_url?: string | null
  }) => api.post("/api/v1/admin/integration/services", payload),
}
