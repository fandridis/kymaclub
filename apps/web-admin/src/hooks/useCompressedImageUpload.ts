"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import imageCompression from "browser-image-compression";

export type UseCompressedImageUploadOptions = {
    preCompressionMaxBytes?: number; // default 5MB
    compression?: {
        maxSizeMB?: number; // default 1
        maxWidthOrHeight?: number; // default 1400
        useWebWorker?: boolean; // default true
        quality?: number; // default 0.9
        initialQuality?: number; // default 0.9
    };
};

export type SaveHandler<Result = any> = (storageId: string) => Promise<Result>;

export function useCompressedImageUpload(options?: UseCompressedImageUploadOptions) {
    const [status, setStatus] = useState<"idle" | "preparing" | "uploading">("idle");

    const generateUploadUrl = useMutation(api.mutations.uploads.generateUploadUrl);

    const uploadImage = useCallback(
        async <T = any>(file: File, onSave?: SaveHandler<T>) => {
            if (!file) return undefined as unknown as T;

            if (!file.type.startsWith("image/")) {
                console.error("Please upload an image file (e.g., JPG, PNG).");
                return undefined as unknown as T;
            }

            const preMax = options?.preCompressionMaxBytes ?? 10 * 1024 * 1024; // 10MB default
            if (file.size > preMax) {
                const mb = Math.round(preMax / (1024 * 1024));
                console.error(`Original image size should not exceed ${mb}MB.`);
                return undefined as unknown as T;
            }


            try {
                setStatus("preparing");

                const compressionOptions = {
                    maxSizeMB: options?.compression?.maxSizeMB ?? 1,
                    maxWidthOrHeight: options?.compression?.maxWidthOrHeight ?? 800,
                    useWebWorker: options?.compression?.useWebWorker ?? true,
                    quality: options?.compression?.quality ?? 0.8,
                    initialQuality: options?.compression?.initialQuality ?? 0.8,
                } as const;

                const compressedFile = await imageCompression(file, compressionOptions as any);

                const { url: postUrl } = await generateUploadUrl();

                setStatus("uploading");

                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": compressedFile.type },
                    body: compressedFile,
                });
                const { storageId } = await result.json();

                let saveResult: any = undefined;
                if (onSave) {
                    saveResult = await onSave(storageId);
                }

                return (onSave ? saveResult : (storageId as unknown)) as T;
            } catch (error: any) {
                if (error?.message?.includes("Failed to compress")) {
                    console.error("Failed to compress image. Please try a different image or reduce the file size.");
                } else {
                    console.error(error?.message || "An unexpected error occurred during upload.");
                }
                throw error;
            } finally {
                setStatus("idle");
            }
        },
        [generateUploadUrl, options]
    );

    return { status, uploadImage };
} 