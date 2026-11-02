import { ArchiveIcon, PlusIcon, SettingsIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

import { ProjectStatusBadge } from "@/components/common/ProjectBadges"
import { CopyText } from "@/components/data-table/cells"
import { DataTable } from "@/components/data-table/DataTable"
import {
  filterKeys,
  type Column,
  type FilterDef,
  type Preset,
  type RowAction,
} from "@/components/data-table/types"
import { Button } from "@/components/ui/button"
import { PERMISSIONS } from "@/constants/permissions"
import { usePermission } from "@/hooks/usePermission"
import { useTableParams } from "@/hooks/useTableParams"
import { PageActions } from "@/layouts/templates"
import { formatDateTime } from "@/lib/format"
import { useProjects } from "@/queries/console/system/projects"
import { PROJECT_STATUS, type ProjectRow } from "@/types/project"
import { CreateProjectDialog } from "./CreateProjectDialog"
import { DeleteProjectDialog } from "./DeleteProjectDialog"

// A project's own settings pages; the general tab is the first.
const settingsPath = (p: ProjectRow) => `/console/settings/${p.id}/general`

export default function ProjectsPage() {
  const { t } = useTranslation()
  const { can } = usePermission()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  // The row stays set after closing, so the dialog keeps its content while it fades out.
  const [deleting, setDeleting] = useState<{ project: ProjectRow; open: boolean } | null>(null)

  const canWrite = can(PERMISSIONS.systemProjectWrite)
  const isDeleted = (p: ProjectRow) => p.status === PROJECT_STATUS.deleted

  const filters: FilterDef[] = [
    {
      type: "text",
      key: "q",
      label: t("projects.name"),
      placeholder: t("projects.searchPlaceholder"),
      ops: ["contains"],
    },
    {
      type: "text",
      key: "comment",
      label: t("projects.comment"),
      placeholder: t("projects.searchCommentPlaceholder"),
      ops: ["contains"],
    },
    {
      type: "select",
      key: "status",
      label: t("projects.status.label"),
      options: [
        { value: "1", label: t("projects.status.active") },
        { value: "2", label: t("projects.status.disabled") },
        { value: "3", label: t("projects.status.deleted") },
      ],
    },
    { type: "dateTime", key: "created", label: t("projects.created") },
  ]

  const presets: Preset[] = [
    { id: "all", label: t("projects.presets.all"), filters: {} },
    { id: "active", label: t("projects.presets.active"), filters: { status: "1" } },
    { id: "disabled", label: t("projects.presets.disabled"), filters: { status: "2" } },
    { id: "deleted", label: t("projects.presets.deleted"), filters: { status: "3" } },
  ]

  const columns: Column<ProjectRow>[] = [
    {
      id: "name",
      header: t("projects.name"),
      width: 240,
      sortKey: "name",
      // A deleted project has no settings to open, so its name is plain text.
      // The link is inline inside a block that does the truncating, so only the
      // text itself is clickable and underlined; the rest of the cell opens the details.
      cell: (p) =>
        isDeleted(p) ? (
          <span className="block truncate text-muted-foreground line-through">{p.name}</span>
        ) : (
          <span className="block truncate">
            <Link to={settingsPath(p)} title={p.name} className="font-medium hover:underline">
              {p.name}
            </Link>
          </span>
        ),
    },
    {
      id: "id",
      header: t("projects.id"),
      width: 100,
      sortKey: "id",
      cell: (p) => p.id,
    },
    {
      id: "status",
      header: t("projects.status.label"),
      width: 120,
      cell: (p) => <ProjectStatusBadge status={p.status} />,
    },
    {
      id: "comment",
      header: t("projects.comment"),
      width: 220,
      cell: (p) => p.comment || <span className="text-muted-foreground">—</span>,
    },
    {
      id: "creator",
      header: t("projects.creator"),
      hint: t("projects.creatorHint"),
      width: 240,
      // Reference only. The email is empty when the admin is gone; the id still says who.
      cell: (p) =>
        p.created_by > 0 ? (
          p.creator_email || `#${p.created_by}`
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "created",
      header: t("projects.created"),
      width: 180,
      sortKey: "created",
      cell: (p) => formatDateTime(p.created_at),
    },
  ]

  const rowActions: RowAction<ProjectRow>[] = [
    {
      id: "settings",
      label: t("projects.actions.settings"),
      icon: SettingsIcon,
      inline: true,
      hidden: isDeleted,
      onSelect: (p) => void navigate(settingsPath(p)),
    },
    {
      id: "delete",
      label: t("projects.actions.delete"),
      icon: ArchiveIcon,
      inline: true,
      destructive: true,
      hidden: (p) => !canWrite || isDeleted(p),
      onSelect: (p) => setDeleting({ project: p, open: true }),
    },
  ]

  const table = useTableParams(filterKeys(filters))
  const { data, isPending, isFetching, isError, refetch } = useProjects({
    page: table.page,
    pageSize: table.pageSize,
    sort: table.sort,
    filters: table.filters,
  })

  return (
    <>
      {canWrite && (
        <PageActions>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> {t("projects.create.button")}
          </Button>
        </PageActions>
      )}
      <CreateProjectDialog open={creating} onOpenChange={setCreating} />
      {deleting && (
        <DeleteProjectDialog
          key={deleting.project.id}
          project={deleting.project}
          open={deleting.open}
          onOpenChange={(open) => !open && setDeleting((d) => d && { ...d, open: false })}
        />
      )}
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(p) => p.id}
        total={data?.total ?? 0}
        params={table}
        isLoading={isPending}
        isFetching={isFetching}
        isError={isError}
        onRetry={() => void refetch()}
        presets={presets}
        filters={filters}
        rowActions={rowActions}
        renderDetail={(p) => ({
          title: p.name,
          description: t("projects.detail.description"),
          metadata: [
            { label: t("projects.id"), value: <CopyText value={String(p.id)} /> },
            { label: t("projects.name"), value: p.name },
            { label: t("projects.status.label"), value: <ProjectStatusBadge status={p.status} /> },
            {
              label: t("projects.creator"),
              value: p.created_by > 0 ? p.creator_email || `#${p.created_by}` : "—",
            },
            { label: t("projects.comment"), value: p.comment || "—" },
            { label: t("projects.created"), value: formatDateTime(p.created_at) },
          ],
          actions: isDeleted(p)
            ? []
            : [{ id: "settings", label: t("projects.actions.settings"), href: settingsPath(p) }],
        })}
      />
    </>
  )
}
