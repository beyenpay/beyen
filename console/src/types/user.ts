// Mirrors gateway dto/console UserListItem.
export type UserRow = {
    id: number
    email: string
    status: number // 1 active, 2 disabled, 3 deleted
    system_role: string // empty for a normal user
    created_at: number // unix seconds
    updated_at: number
}
