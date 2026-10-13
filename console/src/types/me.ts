// Mirrors gateway/dto/console MeResponse. Field names stay snake_case,
// exactly as on the wire, so there is no mapping layer to maintain.
export type UserInfo = {
    id: number
    email: string
    system_role: string // empty for a normal user
}

export type ProjectAccess = {
    id: number
    name: string
    status: number // 1 active, 2 disabled
    role: string
    permissions: string[] // empty unless the project is active
}

export type Me = {
    user: UserInfo
    permissions: {
        system: string[]
        projects: ProjectAccess[]
    }
}