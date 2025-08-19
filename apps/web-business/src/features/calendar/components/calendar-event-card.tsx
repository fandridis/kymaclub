import type { EventContentArg } from "@fullcalendar/core/index.js";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
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
}

export const CalendarEventCard = ({ eventInfo, onEdit, onDelete }: CalendarEventProps) => {
    const classInstance = eventInfo.event.extendedProps.classInstance as ClassInstance;

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(eventInfo);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(eventInfo);
    };

    // if istance.name different than snapshot.name, choose that, otherwise use snapshot.name
    const name = classInstance.name !== classInstance.templateSnapshot.name ? classInstance.name : classInstance.templateSnapshot.name;
    const textColor = TEMPLATE_COLORS_MAP[classInstance.color as TemplateColorType].text;

    return (
        <div className={cn("relative w-full h-full px-1 py-1 group overflow-x-hidden overflow-y-auto", textColor)}>
            <div className="absolute top-1 left-1 pr-8">
                <div className="text-xs font-medium truncate leading-3.5">{name}</div>
                <div className="text-xs opacity-75 truncate leading-3.5">{eventInfo.timeText}</div>
                <div className="text-xs opacity-75 truncate leading-3.5 ">Cpt: {classInstance.bookedCount}/{classInstance.capacity}</div>
            </div>
            <div className="absolute top-1 right-1">
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
                        <DropdownMenuItem onClick={handleEditClick} className="text-gray-700 focus:text-gray-700">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600 focus:text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};