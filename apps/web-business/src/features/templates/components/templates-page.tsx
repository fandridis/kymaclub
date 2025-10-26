"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, BookOpen, Loader2 } from "lucide-react"
import CreateTemplateDialog from "./create-template-dialog"
import { TemplateCard } from "./template-card"
import { usePaginatedClassTemplates } from "@/features/calendar/hooks/use-class-templates"
import { useMutation } from "convex/react"
import { api } from "@repo/api/convex/_generated/api"
import { toast } from "sonner"
import type { Doc } from "@repo/api/convex/_generated/dataModel"

export default function TemplatesPage() {
    const [editingTemplate, setEditingTemplate] = useState<Doc<"classTemplates"> | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deletingTemplate, setDeletingTemplate] = useState<Doc<"classTemplates"> | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const deleteTemplate = useMutation(api.mutations.classTemplates.deleteClassTemplate)

    const {
        isLoading,
        loadMore,
        results: templates,
        status
    } = usePaginatedClassTemplates()

    const handleEditTemplate = (template: Doc<"classTemplates">) => {
        setEditingTemplate(template)
        setIsEditDialogOpen(true)
    }

    const handleCloseEditDialog = () => {
        setEditingTemplate(null)
        setIsEditDialogOpen(false)
    }

    const handleDeleteTemplate = (templateId: string) => {
        const template = templates.find(t => t._id === templateId)
        if (template) {
            setDeletingTemplate(template)
            setIsDeleteDialogOpen(true)
        }
    }

    const handleConfirmDelete = async () => {
        if (!deletingTemplate) return

        try {
            await deleteTemplate({ templateId: deletingTemplate._id })
            setIsDeleteDialogOpen(false)
            setDeletingTemplate(null)
            toast.success("Template deleted successfully!")
        } catch (error) {
            console.error("Failed to delete template:", error)
            toast.error("Failed to delete template. Please try again.")
        }
    }

    const handleCloseDeleteDialog = () => {
        setDeletingTemplate(null)
        setIsDeleteDialogOpen(false)
    }

    const renderEmptyState = () => (
        <Card className="text-center py-12">
            <CardContent>
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                <p className="text-muted-foreground mb-4">
                    Create your first class template to get started with scheduling
                </p>
                <CreateTemplateDialog />
            </CardContent>
        </Card>
    )

    // Show loading state if loading initially
    const isInitialLoading = isLoading && status === "LoadingFirstPage"

    return (
        <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Class Templates</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Create and manage your class templates for easy scheduling
                    </p>
                </div>

                <div className="w-full sm:w-auto sm:shrink-0">
                    <CreateTemplateDialog />
                </div>
            </div>

            {isInitialLoading ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                        <h3 className="text-lg font-semibold mb-2">Loading templates...</h3>
                        <p className="text-muted-foreground">Please wait while we fetch your templates</p>
                    </CardContent>
                </Card>
            ) : templates.length === 0 ? (
                renderEmptyState()
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2">
                        {templates.map((template: Doc<"classTemplates">) => (
                            <TemplateCard
                                key={template._id}
                                template={template}
                                onEdit={handleEditTemplate}
                                onDelete={handleDeleteTemplate}
                            />
                        ))}
                    </div>

                    {/* Load More Button */}
                    {(status === "CanLoadMore" || status === "LoadingMore") && (
                        <div className="flex justify-center mt-8">
                            <Button
                                onClick={() => loadMore(10)}
                                disabled={status !== "CanLoadMore"}
                                variant="outline"
                                className="gap-2"
                            >
                                {status === "LoadingMore" ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Load More Templates
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Edit Template Dialog */}
            {editingTemplate && (
                <CreateTemplateDialog
                    classTemplate={editingTemplate}
                    isOpen={isEditDialogOpen}
                    hideTrigger
                    onClose={handleCloseEditDialog}
                />
            )}

            {/* Delete Template Dialog */}
            {deletingTemplate && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete "{deletingTemplate.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                className="bg-destructive hover:bg-destructive/80"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    )
}
