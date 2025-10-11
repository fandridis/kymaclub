import type { EventContentArg } from "@fullcalendar/core/index.js";
import { MoreVertical, Edit, Trash2, Users, Lock, Unlock, CalendarPlus, CalendarOff, CalendarIcon, CalendarOffIcon, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";
import type { ClassInstance } from "../hooks/use-class-instances";
import { cn } from "@/lib/utils";
import type { TemplateColorType } from "@repo/utils/colors";
import { TEMPLATE_COLORS_MAP } from "@/utils/colors";

interface CalendarEventProps {
    eventInfo: EventContentArg;
    onEdit: (eventInfo: EventContentArg) => void;
    onDelete: (eventInfo: EventContentArg) => void;
    onViewBookings: (eventInfo: EventContentArg) => void;
    onToggleBookings: (eventInfo: EventContentArg) => void;
}

export const CalendarEventCard = ({ eventInfo, onEdit, onDelete, onViewBookings, onToggleBookings }: CalendarEventProps) => {
    const classInstance = eventInfo.event.extendedProps.classInstance as ClassInstance;

    const handleViewBookingsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onViewBookings(eventInfo);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(eventInfo);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(eventInfo);
    };

    const handleToggleBookingsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBookings(eventInfo);
    };

    // if istance.name different than snapshot.name, choose that, otherwise use snapshot.name
    const name = classInstance.name !== classInstance.templateSnapshot.name ? classInstance.name : classInstance.templateSnapshot.name;
    const textColor = TEMPLATE_COLORS_MAP[classInstance.color as TemplateColorType].text;

    // Calculate booking window status
    const getBookingWindowStatus = () => {
        const bookingWindow = classInstance.bookingWindow;
        if (!bookingWindow?.minHours || !bookingWindow?.maxHours) {
            return null; // No booking window defined
        }

        const now = Date.now();
        const classStartTime = classInstance.startTime;
        const hoursUntilClass = (classStartTime - now) / (1000 * 60 * 60);

        // Check if we're within the booking window
        const isWithinBookingWindow = hoursUntilClass >= bookingWindow.minHours && hoursUntilClass <= bookingWindow.maxHours;

        return isWithinBookingWindow ? 'open' : 'closed';
    };

    const bookingWindowStatus = getBookingWindowStatus();

    return (
        <div className={cn("relative w-full h-full px-1 py-1 group overflow-x-hidden overflow-y-auto flex flex-col", textColor)}>
            {/* Main content area */}
            <div className="flex-1 relative">
                <div className="pr-4">
                    <div className="text-xs font-medium truncate leading-3.5">{name}</div>
                    <div className="text-xs opacity-75 truncate leading-3.5">{eventInfo.timeText}</div>
                </div>

                {/* Dropdown menu */}
                <div className="absolute top-0 right-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/20 rounded"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-3 w-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={4}>
                            <DropdownMenuItem onClick={handleViewBookingsClick} className="text-gray-700 focus:text-gray-700">
                                <Users className="h-4 w-4 mr-2" />
                                View Bookings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleEditClick} className="text-gray-700 focus:text-gray-700">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleToggleBookingsClick} className="text-gray-700 focus:text-gray-700">
                                {classInstance.disableBookings ? (
                                    <>
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Open bookings
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Close bookings
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600 focus:text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Footer section with left and right sides */}
            <div className="flex justify-between items-center mt-1">
                {/* Left side - Capacity info */}
                <div className="flex items-center gap-1">
                    <User className="h-3 w-3 opacity-60" />
                    <span className="text-xs opacity-75">{classInstance.bookedCount}/{classInstance.capacity}</span>
                </div>

                {/* Right side - Status icons */}
                <div className="flex items-center gap-1">
                    {/* Lock icon for disabled bookings */}
                    {classInstance.disableBookings && (
                        <Lock className="h-3 w-3 opacity-60" />
                    )}

                    {/* Booking window status icon */}
                    {bookingWindowStatus && (
                        <>
                            {bookingWindowStatus === 'open' ? (
                                <CalendarIcon className="h-3 w-3 opacity-60" />
                            ) : (
                                <CalendarOffIcon className="h-3 w-3 opacity-60" />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};