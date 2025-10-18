'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import styles from './EquipmentManagement.module.css'

interface Equipment {
  id: string
  name: string
  stock: number
  categories?: string[]
  category?: string
}

interface Category {
  id: string
  name: string
  color: string
  order: number
}

interface EquipmentManagementProps {
  equipment: Equipment[]
  categories: Category[]
  searchTerm: string
  onSearchChange: (term: string) => void
  equipmentViewMode: 'all' | 'grouped'
  onViewModeChange: (mode: 'all' | 'grouped') => void
  expandedGroups: Set<string>
  onToggleGroup: (groupId: string) => void
  onDragStart: (equipment: Equipment) => void
  onDragEnd: () => void
  showAddGroup: boolean
  onShowAddGroup: (show: boolean) => void
  newGroupName: string
  onNewGroupNameChange: (name: string) => void
  onAddGroup: () => void
  onCancelAddGroup: () => void
  addCategoryLoading: boolean
}

export default function EquipmentManagement({
  equipment,
  categories,
  searchTerm,
  onSearchChange,
  equipmentViewMode,
  onViewModeChange,
  expandedGroups,
  onToggleGroup,
  onDragStart,
  onDragEnd,
  showAddGroup,
  onShowAddGroup,
  newGroupName,
  onNewGroupNameChange,
  onAddGroup,
  onCancelAddGroup,
  addCategoryLoading
}: EquipmentManagementProps) {
  // 機材グループをFirestoreから取得したデータで構築（複数カテゴリ対応）
  const equipmentGroups = categories.map(category => ({
    id: category.id,
    name: category.name,
    equipment: equipment.filter(eq => {
      // 後方互換性: categoriesまたはcategoryをチェック
      const equipmentCategories = eq.categories || (eq.category ? [eq.category] : [])
      return equipmentCategories.includes(category.id)
    })
  }))

  // 機材検索機能
  const filteredEquipmentGroups = equipmentGroups.map(group => ({
    ...group,
    equipment: group.equipment.filter(equipment => 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.id.toString().includes(searchTerm)
    )
  }))

  return (
    <div className={styles.equipmentSection}>
      <div className={styles.equipmentHeader}>
        <h2 className={styles.sectionTitle}>機材管理</h2>
        <p className={styles.equipmentNote}>※機材の追加・編集は管理者ページで行えます</p>
      </div>

      {/* 検索バー */}
      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="機材名またはNoで検索..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* タブ切り替え */}
      <div className={styles.equipmentTabs}>
        <button 
          className={`${styles.equipmentTab} ${equipmentViewMode === 'all' ? styles.activeEquipmentTab : ''}`}
          onClick={() => onViewModeChange('all')}
        >
          全機材
        </button>
        <button
          className={`${styles.equipmentTab} ${equipmentViewMode === 'grouped' ? styles.activeEquipmentTab : ''}`}
          onClick={() => onViewModeChange('grouped')}
        >
          グループ別
        </button>
      </div>

      {/* 全機材表示 */}
      {equipmentViewMode === 'all' && (
        <div className={styles.allEquipmentList}>
          {equipment.length === 0 ? (
            <div className={styles.emptyState}>
              <p>機材がありません</p>
              <p>管理者ページから機材を追加してください</p>
            </div>
          ) : (
            <div className={styles.equipmentTable}>
              <div className={styles.tableHeader}>
                <div className={styles.tableCell}>機材名</div>
                <div className={styles.tableCell}>在庫</div>
              </div>
              {equipment.map((eq) => (
                <div 
                  key={eq.id} 
                  className={styles.tableRow}
                  draggable
                  onDragStart={() => onDragStart(eq)}
                  onDragEnd={onDragEnd}
                >
                  <div className={styles.tableCell}>
                    <span className={styles.equipmentNumber}>#{eq.id}</span>
                    <span className={styles.equipmentName}>{eq.name}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.equipmentStock}>{eq.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* グループ別表示 */}
      {equipmentViewMode === 'grouped' && (
        <div className={styles.groupedEquipmentList}>
          {/* グループ追加ボタン */}
          <div className={styles.groupAddSection}>
            <button 
              className={styles.addGroupButton}
              onClick={() => onShowAddGroup(true)}
            >
              <Plus className={styles.icon} />
              グループ追加
            </button>
          </div>

          {/* グループ追加フォーム */}
          {showAddGroup && (
            <div className={styles.addGroupForm}>
              <input
                type="text"
                placeholder="グループ名を入力"
                value={newGroupName}
                onChange={(e) => onNewGroupNameChange(e.target.value)}
                className={styles.formInput}
                autoFocus
              />
              <div className={styles.formActions}>
                <button 
                  className={styles.saveButton}
                  onClick={onAddGroup}
                  disabled={addCategoryLoading || !newGroupName.trim()}
                >
                  {addCategoryLoading ? '追加中...' : '追加'}
                </button>
                <button 
                  className={styles.cancelButton}
                  onClick={onCancelAddGroup}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <div className={styles.equipmentGroups}>
            {filteredEquipmentGroups.length === 0 ? (
              <div className={styles.emptyState}>
                <p>機材グループがありません</p>
                <p>「グループ追加」ボタンから新しいグループを作成してください</p>
              </div>
            ) : (
              filteredEquipmentGroups.map((group) => (
                <div key={group.id} className={styles.equipmentGroup}>
                  <div className={styles.groupHeader}>
                    <div 
                      className={styles.groupHeaderContent}
                      onClick={() => onToggleGroup(group.id)}
                    >
                      <span className={styles.groupTitle}>{group.name}</span>
                      <span className={styles.groupSubtitle}>(+で開いて、-で閉じる) 在庫</span>
                      <span className={styles.toggleButton}>
                        {expandedGroups.has(group.id) ? '-' : '+'}
                      </span>
                    </div>
                  </div>
                  {expandedGroups.has(group.id) && (
                    <div className={styles.equipmentTable}>
                      <div className={styles.tableHeader}>
                        <div className={styles.tableCell}>機材名</div>
                        <div className={styles.tableCell}>在庫</div>
                      </div>
                      {group.equipment.length === 0 ? (
                        <div className={styles.emptyEquipment}>
                          <p>このグループに機材がありません</p>
                        </div>
                      ) : (
                        group.equipment.map((equipment) => (
                          <div 
                            key={equipment.id} 
                            className={styles.tableRow}
                            draggable
                            onDragStart={() => onDragStart(equipment)}
                            onDragEnd={onDragEnd}
                          >
                            <div className={styles.tableCell}>
                              <span className={styles.equipmentNumber}>#{equipment.id}</span>
                              <span className={styles.equipmentName}>{equipment.name}</span>
                            </div>
                            <div className={styles.tableCell}>
                              <span className={styles.equipmentStock}>{equipment.stock}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
