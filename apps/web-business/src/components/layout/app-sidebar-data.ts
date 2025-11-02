import {
    LayoutDashboard,
    CalendarHeartIcon,
    BookTemplateIcon,
    DollarSign,
    MessageCircle,
} from 'lucide-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from './types'
import type { TranslationKeys } from '@/lib/typed'

type TypedTFunction = (key: TranslationKeys, options?: any) => string;

export const getSidebarData = (t: TypedTFunction, unreadMessagesCount?: number): SidebarData => ({
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
            title: t('common.general'),
            items: [
                {
                    title: t('routes.dashboard.title'),
                    url: '/dashboard',
                    icon: LayoutDashboard,
                },
                {
                    title: t('routes.calendar.title'),
                    url: '/calendar',
                    icon: CalendarHeartIcon,
                },
                {
                    title: t('routes.templates.title'),
                    url: '/templates',
                    icon: BookTemplateIcon,
                },
                {
                    title: t('routes.earnings.title'),
                    url: '/earnings',
                    icon: DollarSign,
                },
                {
                    title: t('routes.messages.title'),
                    url: '/messages',
                    icon: MessageCircle,
                    badge: unreadMessagesCount && unreadMessagesCount > 0 ?
                        (unreadMessagesCount > 99 ? '99+' : unreadMessagesCount.toString()) :
                        undefined,
                },
                // {
                //     title: t('routes.bookings.title'),
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
})