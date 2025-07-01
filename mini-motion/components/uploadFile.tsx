"use client"; // This component must be a client component

import { upload } from "@imagekit/next";
import { useState } from "react";
type FileUploadProps = {
  onSuccess: (res: any) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video";
};
const FileUpload = ({ onSuccess, onProgress, fileType }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const validateFile = (file: File) => {
    if (fileType === "video") {
      if (!file.type.startsWith("video/")) {
        throw new Error("Please provide valid file type");
      }
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File size must be less than 100 MB");
      }
      return true;
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;
    setUploading(true);
    setError("");
    try {
      const authRespone = await fetch("/api/auth/imagekit-auth");
      const authData = await authRespone.json();
      const uploadResponse = await upload({
        // Authentication parameters
        file,
        fileName: file.name, // Optionally set a custom file name
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        expire: authData.expire,
        token: authData.token,
        signature: authData.signature,
        // Progress callback to update upload progress state
        onProgress: (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = (event.loaded / event.total) * 100;
            onProgress(Math.round(percent));
          }
        },
      });
      onSuccess(uploadResponse);
    } catch (error) {
      console.error(error);
      setError("Error authenticating user");
    } finally {
      setError("");
      setUploading(false);
    }
  };
  return (
    <>
      <input
        type="file"
        accept={fileType === "video" ? "video/*" : "image/*"}
        onChange={handleFileChange}
      />
      {uploading && <span>Uploading...</span>}
      {error && error}
    </>
  );
};

export default FileUpload;
