import {
    Monitor,
    HelpCircle,
    LayoutDashboard,
    Bell,
    Palette,
    Settings,
    BookmarkMinusIcon,
    CalendarHeartIcon,
    BookTemplateIcon,
    DollarSign,
} from 'lucide-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from './types'

export const sidebarData: SidebarData = {
    user: {
        name: 'Gefa',
        email: 'gefa@gmail.com',
        avatar: '',
    },
    teams: [
        {
            name: 'Orcavo Pass',
            logo: Command,
            plan: 'Join the family',
        },
        {
            name: 'Gefa Inc',
            logo: GalleryVerticalEnd,
            plan: 'Enterprise',
        },
        {
            name: 'Gefa Corp.',
            logo: AudioWaveform,
            plan: 'Startup',
        },
    ],
    navGroups: [
        {
            title: 'General',
            items: [
                {
                    title: 'Dashboard',
                    url: '/dashboard',
                    icon: LayoutDashboard,
                },
                {
                    title: 'Schedule',
                    url: '/calendar',
                    icon: CalendarHeartIcon,
                },
                {
                    title: 'Lessons',
                    url: '/templates',
                    icon: BookTemplateIcon,
                },
                {
                    title: 'Earnings',
                    url: '/earnings',
                    icon: DollarSign,
                },
                // {
                //     title: 'Bookings',
                //     url: '/bookings',
                //     icon: BookmarkMinusIcon,
                // },

            ],
        },

        // {
        //     title: 'System',
        //     items: [
        //         {
        //             title: 'Settings',
        //             icon: Settings,
        //             items: [
        //                 {
        //                     title: 'Appearance',
        //                     url: '/about',
        //                     icon: Palette,
        //                 },
        //                 {
        //                     title: 'Notifications',
        //                     url: '/about',
        //                     icon: Bell,
        //                 },
        //                 {
        //                     title: 'Display',
        //                     url: '/about',
        //                     icon: Monitor,
        //                 },
        //             ],
        //         },
        //         {
        //             title: 'Help Center',
        //             url: '/about',
        //             icon: HelpCircle,
        //         },
        //     ],
        // },
    ],
}