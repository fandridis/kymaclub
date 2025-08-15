"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Pick a date and time",
    disabled = false,
    className,
}: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
    const [isOpen, setIsOpen] = React.useState(false)

    // Extract time from the selected date or use current time as default
    const [timeValue, setTimeValue] = React.useState(() => {
        if (value) {
            const hours = value.getHours().toString().padStart(2, '0')
            const minutes = value.getMinutes().toString().padStart(2, '0')
            return `${hours}:${minutes}`
        }
        return "09:00"
    })

    // Update time value when the date prop changes
    React.useEffect(() => {
        if (value) {
            const hours = value.getHours().toString().padStart(2, '0')
            const minutes = value.getMinutes().toString().padStart(2, '0')
            setTimeValue(`${hours}:${minutes}`)
            setSelectedDate(value)
        }
    }, [value])

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            // Parse the time and combine with the selected date
            const timeParts = timeValue.split(':')
            const hours = parseInt(timeParts[0] || '0', 10)
            const minutes = parseInt(timeParts[1] || '0', 10)
            const newDateTime = new Date(date)
            newDateTime.setHours(hours, minutes, 0, 0)
            setSelectedDate(newDateTime)
            onChange?.(newDateTime)
        } else {
            setSelectedDate(undefined)
            onChange?.(undefined)
        }
    }

    const handleTimeChange = (newTime: string) => {
        setTimeValue(newTime)

        if (selectedDate) {
            const timeParts = newTime.split(':')
            const hours = parseInt(timeParts[0] || '0', 10)
            const minutes = parseInt(timeParts[1] || '0', 10)
            const newDateTime = new Date(selectedDate)
            newDateTime.setHours(hours, minutes, 0, 0)
            setSelectedDate(newDateTime)
            onChange?.(newDateTime)
        }
    }

    const formatDisplayValue = () => {
        if (!selectedDate) return placeholder
        const dateStr = format(selectedDate, "PPP")
        const timeStr = format(selectedDate, "HH:mm")
        return `${dateStr} at ${timeStr}`
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDisplayValue()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    <div className="border-t pt-3">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="time"
                                value={timeValue}
                                onChange={(e) => handleTimeChange(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
} 