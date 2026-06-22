import type { ReactNode } from "react"
import OwnerSidebar from "./OwnerSidebar"
import OwnerTopbar from "./OwnerTopbar"

type OwnerWorkspaceShellProps = {
  title: string
  eyebrow?: string
  description?: string
  user?: { name: string; email: string }
  action?: ReactNode
  children: ReactNode
}

export default function OwnerWorkspaceShell(props: OwnerWorkspaceShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f1eb] text-[#2f241b]">
      <div className="flex min-h-screen max-lg:flex-col">
        <OwnerSidebar user={props.user} />
        <section className="min-w-0 flex-1">
          <OwnerTopbar title={props.title} eyebrow={props.eyebrow} description={props.description} user={props.user} action={props.action} />
          <div className="p-6 max-sm:p-4">
            {props.children}
          </div>
        </section>
      </div>
    </main>
  )
}
