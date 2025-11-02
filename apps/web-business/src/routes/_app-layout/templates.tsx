import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import TemplatesPage from '@/features/templates/components/templates-page'
import { createFileRoute } from '@tanstack/react-router'
import { useTypedTranslation } from '@/lib/typed'

export const Route = createFileRoute('/_app-layout/templates')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTypedTranslation();
    return <>
        <Header fixed title={t('routes.templates.title')} />
        <Main>
            <TemplatesPage />
        </Main>
    </>
}
