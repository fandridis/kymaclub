import React from 'react'
import { cn } from '@/lib/utils'

interface MainProps extends React.HTMLAttributes<HTMLElement> {
    fixed?: boolean
    ref?: React.Ref<HTMLElement>
}

export const Main = ({ fixed, className, ...props }: MainProps) => {
    return (
        <main
            className={cn(
                'flex-1 px-3 md:px-4 py-0 peer-[.header-fixed]/header:mt-16',
                'mx-auto w-full max-w-7xl',
                fixed && 'fixed-main flex grow flex-col overflow-hidden',
                className
            )}
            {...props}
        />
    )
}

Main.displayName = 'Main'