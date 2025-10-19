// 機材管理システムの型定義

export interface Equipment {
  id: string
  name: string
  category?: string // 後方互換性のため残す（非推奨）
  categories: string[] // 複数カテゴリ対応
  quantity: number
  stock: number // 在庫数
  description?: string
  specifications?: {
    [key: string]: string
  }
  maintenanceDate?: Date
  status: 'available' | 'maintenance' | 'out_of_order'
  location?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  siteName: string
  startDate: string
  endDate: string
  assigneeId?: string // 後方互換性のため残す（非推奨）
  assigneeIds?: string[] // 複数担当者対応
  equipment: {
    equipmentId: string
    equipmentName: string
    quantity: number
    notes?: string
  }[]
  description?: string
  notes?: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  createdBy: string
  userName?: string
  location?: string
  coordinates?: {
    lat: number
    lng: number
  }
  budget?: number
  client?: string
  contactInfo?: {
    name: string
    phone?: string
    email?: string
  }
  createdAt: Date
  updatedAt: Date
  googleCalendarEventId?: string
}

export interface EquipmentCategory {
  id: string
  name: string
  color: string
  order: number
}

export interface Assignee {
  id: string
  name: string
  email?: string
  phone?: string
  department?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'admin' | 'manager' | 'staff'
  permissions: string[]
  department?: string
  phone?: string
  isActive: boolean
  createdAt: Date
  lastLoginAt: Date
}

export interface Schedule {
  id: string
  equipmentId: string
  equipmentName: string
  eventId: string
  eventName: string
  startDate: string
  endDate: string
  status: 'scheduled' | 'in_use' | 'returned' | 'cancelled'
  notes?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  equipmentName: string
  type: 'routine' | 'repair' | 'inspection' | 'replacement'
  description: string
  cost?: number
  performedBy: string
  performedAt: Date
  nextMaintenanceDate?: Date
  status: 'completed' | 'pending' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resourceType: 'equipment' | 'event' | 'schedule' | 'user'
  resourceId: string
  details: {
    [key: string]: any
  }
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

// Firestore コレクション名
export const COLLECTIONS = {
  EVENTS: 'events',
  EQUIPMENT: 'equipment',
  EQUIPMENT_CATEGORIES: 'equipmentCategories',
  USERS: 'users',
  ASSIGNEES: 'assignees',
  SCHEDULES: 'schedules',
  MAINTENANCE_RECORDS: 'maintenanceRecords',
  AUDIT_LOGS: 'auditLogs'
} as const

// 機材カテゴリーのデフォルト値（空の配列に変更）
export const DEFAULT_EQUIPMENT_CATEGORIES: Omit<EquipmentCategory, 'id'>[] = []

// サンプル機材データ（空の配列に変更）
export const SAMPLE_EQUIPMENT: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>[] = []
