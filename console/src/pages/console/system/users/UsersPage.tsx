import { CopyIcon, PencilIcon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { CopyText } from "@/components/data-table/cells"
import { DataTable } from "@/components/data-table/DataTable"
import {
  filterKeys,
  type BulkAction,
  type Column,
  type FilterDef,
  type Preset,
  type RowAction,
} from "@/components/data-table/types"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { PERMISSIONS } from "@/constants/permissions"
import { usePermission } from "@/hooks/usePermission"
import { useTableParams } from "@/hooks/useTableParams"
import { PageActions } from "@/layouts/templates"
import { copyText } from "@/lib/clipboard"
import { formatDateTime } from "@/lib/format"
import { useMe } from "@/queries/console/auth/me"
import { useRestoreUser, useUsers } from "@/queries/console/system/users"
import { USER_STATUS, type UserRow } from "@/types/user"
import { CreateUserDialog } from "./CreateUserDialog"
import { DeleteUserDialog } from "./DeleteUserDialog"
import { EditUserDialog } from "./EditUserDialog"
import { UserRoleBadge, UserStatusBadge } from "@/components/common/UserBadges"

export default function UsersPage() {
  const { t } = useTranslation()
  const { can } = usePermission()
  const { data: me } = useMe()
  const restore = useRestoreUser()
  const [creating, setCreating] = useState(false)
  // The row stays set after closing, so the dialog keeps its content while it fades out.
  const [dialog, setDialog] = useState<{
    kind: "edit" | "delete"
    user: UserRow
    open: boolean
  } | null>(null)
  const closeDialog = () => setDialog((d) => d && { ...d, open: false })

  const canWrite = can(PERMISSIONS.systemUserWrite)
  const isDeleted = (u: UserRow) => u.status === USER_STATUS.deleted
  const isSelf = (u: UserRow) => u.id === me?.user.id

  const filters: FilterDef[] = [
    {
      type: "text",
      key: "q",
      label: t("users.email"),
      placeholder: t("users.searchPlaceholder"),
      ops: ["contains"],
    },
    {
      type: "text",
      key: "comment",
      label: t("users.comment"),
      placeholder: t("users.searchCommentPlaceholder"),
      ops: ["contains"],
    },
    {
      type: "select",
      key: "status",
      label: t("users.status.label"),
      options: [
        { value: "1", label: t("users.status.active") },
        { value: "2", label: t("users.status.disabled") },
        { value: "3", label: t("users.status.deleted") },
      ],
    },
    {
      type: "multiSelect",
      key: "role",
      label: t("users.role"),
      options: [
        { value: "admin", label: t("users.roles.admin") },
        { value: "user", label: t("users.roles.user") },
      ],
    },
    { type: "dateTime", key: "created", label: t("users.created") },
  ]

  const presets: Preset[] = [
    { id: "all", label: t("users.presets.all"), filters: {} },
    {
      id: "active",
      label: t("users.presets.active"),
      filters: { status: "1" },
    },
    {
      id: "disabled",
      label: t("users.presets.disabled"),
      filters: { status: "2" },
    },
    {
      id: "admins",
      label: t("users.presets.admins"),
      filters: { role: "admin" },
    },
  ]

  const columns: Column<UserRow>[] = [
    { id: "id", header: "ID", width: 80, sortKey: "id", cell: (u) => u.id },
    {
      id: "email",
      header: t("users.email"),
      width: 320,
      sortKey: "email",
      cell: (u) => <CopyText value={u.email} mono={false} />,
    },
    {
      id: "role",
      header: t("users.role"),
      hint: t("users.roleHint"),
      width: 120,
      cell: (u) => <UserRoleBadge role={u.system_role} />,
    },
    {
      id: "status",
      header: t("users.status.label"),
      hint: t("users.statusHint"),
      width: 120,
      cell: (u) => <UserStatusBadge status={u.status} />,
    },
    {
      id: "comment",
      header: t("users.comment"),
      width: 220,
      cell: (u) => u.comment || <span className="text-muted-foreground">—</span>,
    },
    {
      id: "created",
      header: t("users.created"),
      width: 180,
      sortKey: "created",
      cell: (u) => formatDateTime(u.created_at),
    },
  ]

  const rowActions: RowAction<UserRow>[] = [
    {
      id: "edit",
      label: t("users.actions.edit"),
      icon: PencilIcon,
      group: t("users.actions.manage"),
      // A deleted user is read only until restored.
      hidden: (u) => !canWrite || isDeleted(u),
      onSelect: (u) => setDialog({ kind: "edit", user: u, open: true }),
    },
    {
      id: "restore",
      label: t("users.actions.restore"),
      icon: RotateCcwIcon,
      group: t("users.actions.manage"),
      hidden: (u) => !canWrite || !isDeleted(u),
      onSelect: (u) =>
        restore.mutate(u.id, {
          onSuccess: () => toast.add({ type: "success", title: t("users.restored", { email: u.email }) }),
        }),
    },
    {
      id: "delete",
      label: t("users.actions.delete"),
      icon: Trash2Icon,
      group: t("users.actions.manage"),
      destructive: true,
      // Not your own account: the gateway refuses it, so do not offer it.
      hidden: (u) => !canWrite || isDeleted(u) || isSelf(u),
      onSelect: (u) => setDialog({ kind: "delete", user: u, open: true }),
    },
  ]

  const bulkActions: BulkAction<UserRow>[] = [
    {
      id: "copyEmails",
      label: t("users.copyEmails"),
      icon: CopyIcon,
      onSelect: (rows, clear) => {
        void copyText(
          rows.map((u) => u.email).join("\n"),
          t("dataTable.copied")
        ).then((ok) => ok && clear())
      },
    },
  ]

  const table = useTableParams(filterKeys(filters))
  const { data, isPending, isFetching, isError, refetch } = useUsers({
    page: table.page,
    pageSize: table.pageSize,
    sort: table.sort,
    filters: table.filters,
  })

  return (
    <>
      {can(PERMISSIONS.systemUserWrite) && (
        <PageActions>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> {t("users.create.button")}
          </Button>
        </PageActions>
      )}
      <CreateUserDialog open={creating} onOpenChange={setCreating} />
      {dialog?.kind === "edit" && (
        <EditUserDialog
          key={dialog.user.id}
          user={dialog.user}
          isSelf={isSelf(dialog.user)}
          open={dialog.open}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteUserDialog
          key={dialog.user.id}
          user={dialog.user}
          open={dialog.open}
          onOpenChange={(open) => !open && closeDialog()}
        />
      )}
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(u) => u.id}
        total={data?.total ?? 0}
        params={table}
        isLoading={isPending}
        isFetching={isFetching}
        isError={isError}
        onRetry={() => void refetch()}
        presets={presets}
        filters={filters}
        rowActions={rowActions}
        bulkActions={bulkActions}
        renderDetail={(u) => ({
          title: t("users.detail.title"),
          description: t("users.detail.description"),
          metadata: [
            { label: "ID", value: <CopyText value={String(u.id)} /> },
            {
              label: t("users.email"),
              value: <CopyText value={u.email} mono={false} />,
            },
            {
              label: t("users.role"),
              value: <UserRoleBadge role={u.system_role} />,
            },
            {
              label: t("users.status.label"),
              value: <UserStatusBadge status={u.status} />,
            },
            {
              label: t("users.comment"),
              value: u.comment || "—",
            },
            {
              label: t("users.created"),
              value: formatDateTime(u.created_at),
            },
            {
              label: t("users.updated"),
              value: formatDateTime(u.updated_at),
            },
          ],
          // Optional: notes under the metadata, and buttons beside Close, e.g.
          // sections: [{ title: "...", description: "..." }],
          // actions: [{ id: "open", label: "...", href: `/console/system/users/${u.id}` }],
        })}
      />
    </>
  )
}
