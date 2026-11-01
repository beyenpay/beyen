import { CopyIcon, MailIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  CopyText,
  DetailList,
} from "@/components/data-table/cells"
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
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PERMISSIONS } from "@/constants/permissions"
import { usePermission } from "@/hooks/usePermission"
import { useTableParams } from "@/hooks/useTableParams"
import { PageActions } from "@/layouts/templates"
import { copyText } from "@/lib/clipboard"
import { formatDateTime } from "@/lib/format"
import { useUsers } from "@/queries/console/system/users"
import type { UserRow } from "@/types/user"
import { CreateUserDialog } from "./CreateUserDialog"
import { UserRoleBadge, UserStatusBadge } from "@/components/common/UserBadges"

export default function UsersPage() {
  const { t } = useTranslation()
  const { can } = usePermission()
  const [creating, setCreating] = useState(false)

  const filters: FilterDef[] = [
    {
      type: "text",
      key: "q",
      label: t("users.email"),
      placeholder: t("users.searchPlaceholder"),
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
      type: "select",
      key: "role",
      label: t("users.role"),
      options: [
        { value: "admin", label: t("users.roles.admin") },
        { value: "user", label: t("users.roles.user") },
      ],
    },
    { type: "dateRange", key: "created", label: t("users.created") },
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
    { id: "id", header: "ID", width: 80, cell: (u) => u.id },
    {
      id: "email",
      header: t("users.email"),
      width: 320,
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
      id: "created",
      header: t("users.created"),
      width: 180,
      cell: (u) => formatDateTime(u.created_at),
    },
  ]

  const rowActions: RowAction<UserRow>[] = [
    {
      id: "copyEmail",
      label: t("users.copyEmail"),
      icon: MailIcon,
      group: t("dataTable.copy"),
      inline: true,
      onSelect: (u) => void copyText(u.email, t("dataTable.copied")),
    },
    {
      id: "copyId",
      label: t("users.copyId"),
      icon: CopyIcon,
      group: t("dataTable.copy"),
      onSelect: (u) => void copyText(String(u.id), t("dataTable.copied")),
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
      <div className="flex flex-col gap-2 border">
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </div>
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
        renderDetail={(u) => (
          <>
            <DialogHeader>
              <DialogTitle>{t("users.detail.title")}</DialogTitle>
              <DialogDescription>
                {t("users.detail.description")}
              </DialogDescription>
            </DialogHeader>
            <DetailList
              items={[
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
                  label: t("users.created"),
                  value: formatDateTime(u.created_at),
                },
                {
                  label: t("users.updated"),
                  value: formatDateTime(u.updated_at),
                },
              ]}
            />
          </>
        )}
      />
    </>
  )
}
