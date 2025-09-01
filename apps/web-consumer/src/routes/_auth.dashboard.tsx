import { createFileRoute } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return <div className="p-2">Hello from Dashboard! <SignOutButton /></div>
}

function SignOutButton() {
  const { signOut } = useAuthActions();
  return <button className="border-2 border-slate-200 text-dark rounded-md px-2 py-1" onClick={() => signOut()}>Sign out</button>
}