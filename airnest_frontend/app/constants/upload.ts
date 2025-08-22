export interface PresignedUploadData {
  success: boolean;
  data: {
    upload_url: string;
    object_key: string;
    file_url: string;
    expires_in: number;
    max_file_size: number;
    content_type: string;
  };
}

export interface UploadRequest {
  file_type: string;
  file_size: number;
  prefix?: string;
  propertyId?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  objectKey?: string;
  fileUrl?: string;
  error?: string;
}

export interface R2ImageData {
  id?: string;
  objectKey: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  etag?: string;
  order: number;
  isMain: boolean;
  altText?: string;
  uploadedAt?: string;
}

// 用于兼容现有ImageData接口
export interface LegacyImageData {
  id: number;
  imageURL: string;
  thumbnailURL?: string | null;
  is_main: boolean;
  order: number;
}