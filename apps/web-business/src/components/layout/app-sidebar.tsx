import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
// import { TeamSwitcher } from '@/components/layout/team-switcher'
import { sidebarData } from './app-sidebar-data'
import logoSrc from '@/assets/kymaclub-square-logo.png'
import { cn } from '@/lib/utils'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { state, isMobile } = useSidebar()

    const isCollapsed = state === 'collapsed'
    console.log(': ', isCollapsed)

    return (
        <Sidebar collapsible='icon' variant='floating' {...props}>
            <SidebarHeader>
                {/* <TeamSwitcher teams={sidebarData.teams} /> */}
                <div className={cn("flex items-center gap-2 px-2 py-1", isCollapsed && "pb-16")}>
                    <img
                        src={logoSrc}
                        alt="KymaClub Logo"
                        className={cn("h-14 w-14 rounded-md", isCollapsed && "absolute left-1/2 -translate-x-1/2 top-8 -translate-y-1/2 h-10 w-10")}
                    />
                    <span className="font-semibold text-xl text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                        KymaClub
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {sidebarData.navGroups.map((props) => (
                    <NavGroup key={props.title} {...props} />
                ))}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={sidebarData.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}