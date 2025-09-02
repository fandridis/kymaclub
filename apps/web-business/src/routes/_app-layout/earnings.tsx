import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import EarningsPage from '@/features/earnings/components/earnings-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app-layout/earnings')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Header fixed title="My Earnings" />
      <Main>
        <EarningsPage />
      </Main>
    </>
  )
}