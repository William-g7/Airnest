import apiService from '@auth/client/clientApiService';
import type {
  PresignedUploadData,
  UploadRequest,
  UploadProgress,
  UploadResult,
  ImagePreviewData,
  R2ImageData,
} from '@addProperty/types';

/** 获取预签名信息（包装成固定返回） */
export async function getPresignedUploadUrl(
  req: UploadRequest
): Promise<PresignedUploadData['data']> {
  const res: PresignedUploadData = await apiService.getPresignedUploadUrl(req);
  if (!res?.success || !res?.data) {
    throw new Error((res as any)?.error || 'Failed to get presigned upload url');
  }
  return res.data;
}

/** 通过 XHR PUT 上传到 R2，可拿到上传进度与 ETag */
export function uploadFileToR2(
  file: File,
  presigned: PresignedUploadData['data'],
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // 基础校验
    if (presigned.max_file_size && file.size > presigned.max_file_size) {
      return resolve({ success: false, error: 'File too large' });
    }

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presigned.upload_url, true);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (evt) => {
      if (!onProgress || !evt.lengthComputable) return;
      onProgress({
        loaded: evt.loaded,
        total: evt.total,
        percentage: Math.round((evt.loaded / evt.total) * 100),
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          success: true,
          objectKey: presigned.object_key,
          fileUrl: presigned.file_url,
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(file);
  });
}

/** 批量上传（保持顺序，自动设置第 0 张为主图） */
export async function uploadImagesToR2Batch(
  images: ImagePreviewData[],
  propertyId: string,
  opts?: {
    prefix?: string;
    onEachProgress?: (index: number, p: UploadProgress) => void;
    abortSignal?: AbortSignal;
  }
): Promise<R2ImageData[]> {
  const results: R2ImageData[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    const presigned = await getPresignedUploadUrl({
      file_type: img.file.type,
      file_size: img.file.size,
      propertyId,
      prefix: opts?.prefix,
    });

    const putRes = await uploadFileToR2(
      img.file,
      presigned,
      (p) => opts?.onEachProgress?.(i, p),
      opts?.abortSignal
    );

    if (!putRes.success || !putRes.fileUrl || !putRes.objectKey) {
      throw new Error(putRes.error || `Upload failed for ${img.file.name}`);
    }

    results.push({
      objectKey: putRes.objectKey,
      fileUrl: putRes.fileUrl,
      fileSize: img.file.size,
      contentType: img.file.type,
      order: i,
      isMain: i === 0,
    });
  }

  return results;
}
