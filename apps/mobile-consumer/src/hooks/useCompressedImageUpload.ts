import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export type UseCompressedImageUploadOptions = {
    preCompressionMaxBytes?: number; // default 5MB
    compression?: {
        maxWidth?: number; // default 800
        maxHeight?: number; // default 800
        quality?: number; // default 0.8
    };
};

export type SaveHandler<Result = any> = (storageId: string) => Promise<Result>;

export function useCompressedImageUpload(options?: UseCompressedImageUploadOptions) {
    const [status, setStatus] = useState<"idle" | "preparing" | "uploading">("idle");

    const generateUploadUrl = useMutation(api.mutations.uploads.generateUploadUrl);

    const pickAndUploadImage = useCallback(
        async <T = any>(onSave?: SaveHandler<T>) => {
            if (status !== "idle") return undefined as unknown as T;

            try {
                // Request permissions
                const { status: permissionStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionStatus !== 'granted') {
                    Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to change your profile picture.');
                    return undefined as unknown as T;
                }

                // Pick image
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: 'images',
                    allowsEditing: true,
                    aspect: [1, 1], // Square aspect ratio for profile images
                    quality: 1,
                });

                if (result.canceled) {
                    return undefined as unknown as T;
                }

                const asset = result.assets[0];
                return await uploadImage(asset.uri, onSave);
            } catch (error: any) {
                Alert.alert('Error', error?.message || 'An error occurred while picking the image.');
                throw error;
            }
        },
        [status, generateUploadUrl, options]
    );

    const takeAndUploadPhoto = useCallback(
        async <T = any>(onSave?: SaveHandler<T>) => {
            if (status !== "idle") return undefined as unknown as T;

            try {
                // Request permissions
                const { status: permissionStatus } = await ImagePicker.requestCameraPermissionsAsync();
                if (permissionStatus !== 'granted') {
                    Alert.alert('Permission needed', 'Sorry, we need camera permissions to take your profile picture.');
                    return undefined as unknown as T;
                }

                // Take photo
                const result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [1, 1], // Square aspect ratio for profile images
                    quality: 1,
                });

                if (result.canceled) {
                    return undefined as unknown as T;
                }

                const asset = result.assets[0];
                return await uploadImage(asset.uri, onSave);
            } catch (error: any) {
                Alert.alert('Error', error?.message || 'An error occurred while taking the photo.');
                throw error;
            }
        },
        [status, generateUploadUrl, options]
    );

    const uploadImage = useCallback(
        async <T = any>(imageUri: string, onSave?: SaveHandler<T>) => {
            if (!imageUri) return undefined as unknown as T;

            try {
                setStatus("preparing");

                // Get image info to check size
                const imageInfo = await manipulateAsync(imageUri, [], { format: SaveFormat.JPEG });

                const preMax = options?.preCompressionMaxBytes ?? 10 * 1024 * 1024; // 10MB default
                if (imageInfo.uri.length > preMax) {
                    const mb = Math.round(preMax / (1024 * 1024));
                    Alert.alert('File too large', `Original image size should not exceed ${mb}MB.`);
                    return undefined as unknown as T;
                }

                const maxWidth = options?.compression?.maxWidth ?? 800;
                const maxHeight = options?.compression?.maxHeight ?? 800;

                // Get original dimensions
                const { width, height } = imageInfo;
                let newWidth = width;
                let newHeight = height;

                // Calculate new dimensions maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        newHeight = height * (maxWidth / width);
                        newWidth = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        newWidth = width * (maxHeight / height);
                        newHeight = maxHeight;
                    }
                }

                // Compress and resize image
                const manipulatedImage = await manipulateAsync(
                    imageUri,
                    [{ resize: { width: Math.round(newWidth), height: Math.round(newHeight) } }],
                    {
                        compress: options?.compression?.quality ?? 0.8,
                        format: SaveFormat.JPEG,
                    }
                );

                // Generate upload URL
                const { url: postUrl } = await generateUploadUrl();

                setStatus("uploading");

                // Convert image to blob for upload
                const response = await fetch(manipulatedImage.uri);
                const blob = await response.blob();

                // Upload to Convex
                const uploadResult = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });

                if (!uploadResult.ok) {
                    const errorText = await uploadResult.text();
                    throw new Error(`Upload failed: ${uploadResult.status} ${uploadResult.statusText}`);
                }

                const uploadData = await uploadResult.json();
                const { storageId } = uploadData;

                if (!storageId) {
                    throw new Error('No storage ID returned from upload');
                }

                let saveResult: any = undefined;
                if (onSave) {
                    saveResult = await onSave(storageId);
                }

                return (onSave ? saveResult : (storageId as unknown)) as T;
            } catch (error: any) {
                Alert.alert('Upload Error', error?.message || "An unexpected error occurred during upload.");
                throw error;
            } finally {
                setStatus("idle");
            }
        },
        [generateUploadUrl, options]
    );

    return {
        status,
        uploadImage,
        pickAndUploadImage,
        takeAndUploadPhoto
    };
}