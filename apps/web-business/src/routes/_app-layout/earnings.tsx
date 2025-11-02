import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import EarningsPage from '@/features/earnings/components/earnings-page'
import { createFileRoute } from '@tanstack/react-router'
import { useTypedTranslation } from '@/lib/typed'

export const Route = createFileRoute('/_app-layout/earnings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTypedTranslation();
  return (
    <>
      <Header fixed title={t('routes.earnings.title')} />
      <Main>
        <EarningsPage />
      </Main>
    </>
  )
}