import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import TemplatesPage from '@/features/templates/components/templates-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app-layout/templates')({
    component: RouteComponent,
})

function RouteComponent() {
    return <>
        <Header fixed>My lessons</Header>
        <Main>
            <TemplatesPage />
        </Main>
    </>
}
