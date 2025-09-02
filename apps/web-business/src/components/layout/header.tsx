import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NotificationsPopover } from '@/components/notifications-popover'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
    fixed?: boolean
    ref?: React.Ref<HTMLElement>
    /** Simple text title for the header */
    title?: string
    /** Custom render function for title content (takes precedence over title) */
    renderTitle?: () => React.ReactNode
    /** Custom render function for right-side content (appears left of notifications) */
    renderRightSide?: () => React.ReactNode
    /** Whether to hide the notifications bell */
    hideNotifications?: boolean
}

export const Header = ({
    className,
    fixed,
    children,
    title,
    renderTitle,
    renderRightSide,
    hideNotifications = false,
    ...props
}: HeaderProps) => {
    const [offset, setOffset] = React.useState(0)

    React.useEffect(() => {
        const onScroll = () => {
            setOffset(document.body.scrollTop || document.documentElement.scrollTop)
        }

        // Add scroll listener to the body
        document.addEventListener('scroll', onScroll, { passive: true })

        // Clean up the event listener on unmount
        return () => document.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header
            className={cn(
                'SIDEBAR_HEADER bg-background flex h-16 items-center gap-3 p-4 sm:gap-4',
                fixed && 'header-fixed peer/header fixed z-50 w-[inherit] rounded-md',
                offset > 10 && fixed ? 'shadow-sm' : 'shadow-none',
                className
            )}
            {...props}
        >
            <SidebarTrigger variant='outline' className='scale-125 sm:scale-100' />
            <Separator orientation='vertical' className='h-6' />
            <div className="flex-1">
                {renderTitle ? renderTitle() : title ? <h1>{title}</h1> : children}
            </div>
            {renderRightSide && renderRightSide()}
            {!hideNotifications && <NotificationsPopover />}
        </header>
    )
}

Header.displayName = 'Header'