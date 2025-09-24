// 機材管理システムの型定義

export interface Equipment {
  id: string
  name: string
  category: string
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
  SCHEDULES: 'schedules',
  MAINTENANCE_RECORDS: 'maintenanceRecords',
  AUDIT_LOGS: 'auditLogs'
} as const

// 機材カテゴリーのデフォルト値
export const DEFAULT_EQUIPMENT_CATEGORIES: Omit<EquipmentCategory, 'id'>[] = [
  { name: '音響', color: '#1976d2', order: 1 },
  { name: '照明', color: '#d32f2f', order: 2 },
  { name: '映像', color: '#388e3c', order: 3 },
  { name: '配線', color: '#f57c00', order: 4 },
  { name: 'その他', color: '#7b1fa2', order: 5 }
]

// サンプル機材データ
export const SAMPLE_EQUIPMENT: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '音響システム A', category: '音響', quantity: 5, stock: 5, status: 'available', tags: [], description: 'メイン音響システム' },
  { name: '音響システム B', category: '音響', quantity: 3, stock: 3, status: 'available', tags: [], description: 'サブ音響システム' },
  { name: 'マイクセット C', category: '音響', quantity: 10, stock: 10, status: 'available', tags: [], description: 'ワイヤレスマイク' },
  { name: '照明器具 D', category: '照明', quantity: 8, stock: 8, status: 'available', tags: [], description: 'LED照明' },
  { name: '照明器具 E', category: '照明', quantity: 6, stock: 6, status: 'available', tags: [], description: 'スポットライト' },
  { name: 'レーザー照明 F', category: '照明', quantity: 2, stock: 2, status: 'available', tags: [], description: 'レーザーショー用' },
  { name: 'プロジェクター G', category: '映像', quantity: 4, stock: 4, status: 'available', tags: [], description: '4Kプロジェクター' },
  { name: '大型スクリーン H', category: '映像', quantity: 3, stock: 3, status: 'available', tags: [], description: '300インチスクリーン' },
  { name: 'ケーブルセット I', category: '配線', quantity: 20, stock: 20, status: 'available', tags: [], description: '各種ケーブル' },
  { name: '電源タップ J', category: '配線', quantity: 15, stock: 15, status: 'available', tags: [], description: '延長コード' }
]
