// Mirrors gateway dto/console UserListItem.
export type UserRow = {
    id: number
    email: string
    status: number // 1 active, 2 disabled, 3 deleted
    system_role: string // empty for a normal user
    comment: string // empty when there is none
    created_at: number // unix seconds
    updated_at: number
}

// users.status in the gateway.
export const USER_STATUS = { active: 1, disabled: 2, deleted: 3 } as const
