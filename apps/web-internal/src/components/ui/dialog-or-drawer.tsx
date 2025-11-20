import { useIsMobile } from "@/hooks/use-mobile"
import { XIcon } from "lucide-react"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "./dialog"
import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "./drawer"

// Root
export function DialogOrDrawer(props: any) {
    const isMobile = useIsMobile()
    if (isMobile) {
        const { children, ...rest } = props
        return (
            <Drawer direction="bottom" {...rest}>
                {children}
            </Drawer>
        )
    }
    return <Dialog {...props} />
}

// Trigger
export function DialogOrDrawerTrigger(props: any) {
    const isMobile = useIsMobile()
    return isMobile ? (
        <DrawerTrigger {...props} />
    ) : (
        <DialogTrigger {...props} />
    )
}

// Content
export function DialogOrDrawerContent(props: any) {
    const isMobile = useIsMobile()
    if (isMobile) {
        const { children, showCloseButton = true, className, ...rest } = props
        return (
            <DrawerContent className={className} {...rest}>
                {children}
                {showCloseButton && (
                    <DrawerClose
                        className="ring-offset-background focus:ring-ring absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                    >
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DrawerClose>
                )}
            </DrawerContent>
        )
    }
    return <DialogContent {...props} />
}

// Header
export function DialogOrDrawerHeader(props: any) {
    const isMobile = useIsMobile()
    return isMobile ? <DrawerHeader {...props} /> : <DialogHeader {...props} />
}

// Footer
export function DialogOrDrawerFooter(props: any) {
    const isMobile = useIsMobile()
    return isMobile ? <DrawerFooter {...props} /> : <DialogFooter {...props} />
}

// Title
export function DialogOrDrawerTitle(props: any) {
    const isMobile = useIsMobile()
    return isMobile ? <DrawerTitle {...props} /> : <DialogTitle {...props} />
}

// Description
export function DialogOrDrawerDescription(props: any) {
    const isMobile = useIsMobile()
    return isMobile ? (
        <DrawerDescription {...props} />
    ) : (
        <DialogDescription {...props} />
    )
}

// Close
export function DialogOrDrawerClose(props: any) {
    const isMobile = useIsMobile()
    return isMobile ? <DrawerClose {...props} /> : <DialogClose {...props} />
} 