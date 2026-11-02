// Mirrors gateway dto/console ProjectListItem.
export type ProjectRow = {
    id: number
    name: string
    status: number // 1 active, 2 disabled, 3 deleted
    created_by: number // the admin who created it, for reference only; 0 when nobody is credited
    creator_email: string // empty when unknown
    comment: string // empty when there is none
    created_at: number // unix seconds
    updated_at: number
}

// projects.status in the gateway.
export const PROJECT_STATUS = { active: 1, disabled: 2, deleted: 3 } as const
