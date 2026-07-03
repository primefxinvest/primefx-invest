interface AdminPageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
