"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Edit,
    Trash2,
    MapPin,
    Droplets,
    Accessibility,
    Activity,
    CheckCircle,
    XCircle,
    UploadCloud,
    Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Doc, Id } from "@repo/api/convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { useCompressedImageUpload } from "@/hooks/useCompressedImageUpload";
import { Skeleton } from "@/components/ui/skeleton";

interface VenueCardProps {
    venue: Doc<"venues">;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function VenueCard({ venue, onEdit, onDelete }: VenueCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageStorageIds, setImageStorageIds] = useState<Id<"_storage">[]>(venue.imageStorageIds || []);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<Id<"_storage"> | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const addVenueImage = useMutation(api.mutations.uploads.addVenueImage);
    const removeVenueImage = useMutation(api.mutations.uploads.removeVenueImage);

    const { status, uploadImage } = useCompressedImageUpload({
        preCompressionMaxBytes: 10 * 1024 * 1024,
    });

    const imageUrlResults = useQuery(
        api.queries.uploads.getUrls,
        imageStorageIds.length ? { storageIds: imageStorageIds } : "skip"
    );
    const storageIdToUrl = useMemo(() => {
        const map = new Map<string, string | null>();
        if (imageUrlResults) {
            for (const { storageId, url } of imageUrlResults) map.set(storageId, url);
        }
        return map;
    }, [imageUrlResults]);

    useEffect(() => {
        setImageStorageIds(venue.imageStorageIds || []);
    }, [venue.imageStorageIds]);

    if (!venue) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="p-6 text-center text-muted-foreground">
                    No venue data available
                </CardContent>
            </Card>
        );
    }

    const MAX_DESCRIPTION_LENGTH = 200;
    const MAX_IMAGES = 6;
    const fullDescription = (venue.description ?? "").trim();
    const isLongDescription = fullDescription.length > MAX_DESCRIPTION_LENGTH;

    const formatAddress = () => {
        if (!venue.address) return "Address not available";
        const { street, city, state, zipCode, country } = venue.address as any;
        return `${street || ""}${street && city ? ", " : ""}${city || ""}${state ? `, ${state}` : ""} ${zipCode || ""}${country ? `, ${country}` : ""}`;
    };

    const getAmenityIcon = (amenity: string) => {
        switch (amenity) {
            case "showers":
                return <Droplets className="h-4 w-4" />;
            case "accessible":
                return <Accessibility className="h-4 w-4" />;
            case "mats":
                return <Activity className="h-4 w-4" />;
            default:
                return <CheckCircle className="h-4 w-4" />;
        }
    };

    const availableAmenities = venue.amenities
        ? Object.entries(venue.amenities)
            .filter(([_, value]) => value === true)
            .map(([key, _]) => key)
        : [];

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (imageStorageIds.length >= MAX_IMAGES) {
            toast.error(`You can upload a maximum of ${MAX_IMAGES} images per venue.`);
            return;
        }

        try {
            const storageId = await uploadImage<Id<"_storage">>(file, async (sid: string) => {
                await addVenueImage({ venueId: venue._id, storageId: sid as Id<"_storage"> });
                return sid as Id<"_storage">;
            });
            if (storageId) {
                setImageStorageIds((prev) => [...prev, storageId]);
            }
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDeleteImage = (storageId: Id<"_storage">) => {
        setImageToDelete(storageId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteImage = async () => {
        if (imageToDelete) {
            try {
                await removeVenueImage({ venueId: venue._id, storageId: imageToDelete });
                setImageStorageIds((prevImages) => prevImages.filter((id) => id !== imageToDelete));
                toast.success("The image has been removed from the venue.");
            } catch (e: any) {
                toast.error(e?.message ?? "Failed to remove image.");
            }
        }
        setImageToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    return (
        <Card className="w-full max-w-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-semibold leading-tight">
                        {venue.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 ml-2">
                        {(onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={onEdit}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <DropdownMenuItem onClick={onDelete} variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {fullDescription && (
                    <div className="mt-2">
                        <Collapsible className='group/collapsible' open={isDescriptionExpanded} onOpenChange={setIsDescriptionExpanded}>
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-hidden transition-[max-height] duration-300 group-data-[state=closed]/collapsible:max-h-18 group-data-[state=open]/collapsible:max-h-[2000px]">
                                {fullDescription}
                            </div>
                            {isLongDescription && (
                                <CollapsibleTrigger asChild>
                                    <Button variant="link" size="sm" className="px-0 h-auto mt-1 transition-colors group-data-[state=open]/collapsible:text-primary">
                                        {isDescriptionExpanded ? "Read less" : "Read more"}
                                    </Button>
                                </CollapsibleTrigger>
                            )}
                        </Collapsible>
                    </div>
                )}

            </CardHeader>

            <CardContent className="flex flex-col flex-1 gap-4">
                {/* Amenities */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Amenities</h4>
                    {availableAmenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {availableAmenities.map((amenity) => (
                                <Badge key={amenity} variant="outline" className="flex items-center gap-1">
                                    {getAmenityIcon(amenity)}
                                    <span className="capitalize">{amenity}</span>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No amenities found</p>
                    )}
                </div>

                {/* Services */}
                {venue.services && Object.entries(venue.services).some(([_, value]) => value) && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Services</h4>
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(venue.services)
                                .filter(([_, value]) => value)
                                .map(([item]) => (
                                    <Badge key={item} variant="secondary" className="text-xs">
                                        {item}
                                    </Badge>
                                ))}
                        </div>
                    </div>
                )}

                {/* Images Section - Takes available space */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Venue Images ({imageStorageIds.length}/{MAX_IMAGES})</h4>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                            disabled={status !== "idle" || imageStorageIds.length >= MAX_IMAGES}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={status !== "idle" || imageStorageIds.length >= MAX_IMAGES}
                            size="sm"
                            variant="outline"
                            className="h-8"
                        >
                            {status !== "idle" ? (
                                <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    {status === "uploading" ? "Uploading..." : "Preparing..."}
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="mr-1 h-3 w-3" />
                                    Add Image
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
                        {imageStorageIds.length > 0 ? (
                            imageStorageIds.map((sid) => {
                                const url = storageIdToUrl.get(sid as unknown as string) ?? null;
                                return (
                                    <div key={sid as unknown as string} className="relative group aspect-[4/3] rounded-md overflow-hidden">
                                        {url ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <img
                                                        src={url}
                                                        alt={`Venue image`}
                                                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                                                    />
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl p-0">
                                                    <DialogTitle className="sr-only">Venue image</DialogTitle>
                                                    <DialogDescription className="sr-only">Enlarged preview of venue image</DialogDescription>
                                                    <img
                                                        src={url}
                                                        alt={`Venue image`}
                                                        className="w-full h-auto max-h-[80vh] object-contain"
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        ) : (
                                            <Skeleton className="w-full h-full" />
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteImage(sid)}
                                            aria-label="Delete image"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full flex items-center justify-center min-h-[120px] border-2 border-dashed border-muted-foreground/20 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    No images uploaded yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Address - Always at bottom */}
                <div className="mt-auto pt-4 border-t">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground leading-relaxed">
                            {formatAddress()}
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove the image
                            from your venue.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteImage}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}