"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    Clock,
    User2Icon,
    Euro,
    UploadCloud,
    Loader2,
    XCircle,
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

interface TemplateCardProps {
    template: Doc<"classTemplates">
    onEdit?: (template: any) => void
    onDelete?: (templateId: string) => void
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageStorageIds, setImageStorageIds] = useState<Id<"_storage">[]>(template.imageStorageIds || []);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<Id<"_storage"> | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const addTemplateImage = useMutation(api.mutations.uploads.addTemplateImage);
    const removeTemplateImage = useMutation(api.mutations.uploads.removeTemplateImage);

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
        setImageStorageIds(template.imageStorageIds || []);
    }, [template.imageStorageIds]);

    if (!template) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="p-6 text-center text-muted-foreground">
                    No template data available
                </CardContent>
            </Card>
        );
    }

    const MAX_DESCRIPTION_LENGTH = 200;
    const fullDescription = (template.description ?? "").trim();
    const isLongDescription = fullDescription.length > MAX_DESCRIPTION_LENGTH;

    const handleEditTemplate = () => {
        onEdit?.(template)
    }

    const handleDeleteTemplate = () => {
        onDelete?.(template._id)
    }

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (imageStorageIds.length >= 4) {
            toast.error("You can upload a maximum of 4 images per template.");
            return;
        }

        try {
            const storageId = await uploadImage<Id<"_storage">>(file, async (sid: string) => {
                await addTemplateImage({ templateId: template._id, storageId: sid as Id<"_storage"> });
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
                await removeTemplateImage({ templateId: template._id, storageId: imageToDelete });
                setImageStorageIds((prevImages) => prevImages.filter((id) => id !== imageToDelete));
                toast.success("The image has been removed from the template.");
            } catch (e: any) {
                toast.error(e?.message ?? "Failed to remove image.");
            }
        }
        setImageToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3 flex-1 relative">
                {/* Action buttons - positioned absolutely in top right corner */}
                {(onEdit || onDelete) && (
                    <div className="absolute -top-3 right-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onEdit && (
                                    <DropdownMenuItem onClick={handleEditTemplate}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem onClick={handleDeleteTemplate} variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                <div>
                    <div className="flex items-start gap-2 pr-12">
                        <CardTitle className="text-xl font-semibold leading-tight">
                            {template.name}
                        </CardTitle>
                        <Badge variant={template.isActive ? "default" : "secondary"} className="shrink-0 mt-0.5">
                            {template.isActive ? "Active" : "Inactive"}
                        </Badge>
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

                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Images Section */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Template Images ({imageStorageIds.length}/4)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                                        alt={`Template image`}
                                                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                                                    />
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl p-0">
                                                    <DialogTitle className="sr-only">Template image</DialogTitle>
                                                    <DialogDescription className="sr-only">Enlarged preview of template image</DialogDescription>
                                                    <img
                                                        src={url}
                                                        alt={`Template image`}
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
                            <p className="text-sm text-muted-foreground col-span-full">
                                No images uploaded yet.
                            </p>
                        )}
                    </div>
                    <div className="mt-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                            disabled={status !== "idle" || imageStorageIds.length >= 4}
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={status !== "idle" || imageStorageIds.length >= 4}
                        >
                            {status !== "idle" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {status === "uploading" ? "Uploading..." : "Preparing..."}
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    Add Image
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Duration: {template.duration} min</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User2Icon className="h-4 w-4" />
                        <span>{template.instructor}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">
                            €{template.price ? (template.price / 100).toFixed(2) : '10.00'}
                        </span>
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
                            from your template.
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
