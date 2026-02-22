export interface AuthenticatedUser {
  id: string
  email: string
  role: string // UserRole enum values: 'user' | 'advisor' | 'admin' | 'fa_staff'
  ownerId?: string
  allowedPages?: string[]
  staffProfileId?: string
}
