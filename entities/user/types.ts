export type MembershipInfo = {
  id: string
  company: { id: string; name: string; description?: string | null }
  role: { id: number; name: string; description?: string | null }
  status: string
}

export type UserRead = {
  id: string
  email: string | null
  phone: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  is_active: boolean
  is_verified: boolean
  permissions?: string[] | null
  memberships?: MembershipInfo[] | null
}

export type CompanyRead = {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}


export type CompanyData = {
  items: CompanyRead[]
  page: number
  pages: number
  size: number
  total: number
}