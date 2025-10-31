'use client';

import { useState, useRef } from 'react';
import { apiB } from '@/lib/api';
import type { ImageUploaderProps } from '@/types';

export default function ImageUploader({
  onUploadComplete,
  onError,
  maxSize = 10485760, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!acceptedTypes.includes(selectedFile.type)) {
      onError('지원하지 않는 파일 형식입니다. (jpg, png, webp만 가능)');
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      onError(`파일 크기는 ${maxSize / 1048576}MB 이하여야 합니다.`);
      return;
    }

    setFile(selectedFile);

    // Create preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned URL
      const presignResp = await apiB.getPresignedUrl({
        fileName: file.name,
        mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        size: file.size,
      });

      // Step 2: Upload to GCS
      await apiB.uploadToGCS(presignResp.uploadUrl, file);
      setProgress(100);

      // Step 3: Return fileRef
      onUploadComplete(presignResp.fileRef);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '업로드 실패';
      onError(errorMessage);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="image-upload"
          className="block w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700 text-center min-h-[44px] flex items-center justify-center"
        >
          <span className="text-sm">이미지 선택</span>
          <input
            id="image-upload"
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-gray-500 mt-1">
          jpg, png, webp (최대 {maxSize / 1048576}MB)
        </p>
      </div>

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="이미지 제거"
            >
              ×
            </button>
          )}
        </div>
      )}

      {file && !uploading && progress === 0 && (
        <button
          onClick={handleUpload}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium min-h-[44px]"
        >
          업로드
        </button>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-400">업로드 중... {progress}%</p>
        </div>
      )}

      {progress === 100 && (
        <p className="text-sm text-green-500 text-center">업로드 완료!</p>
      )}
    </div>
  );
}

