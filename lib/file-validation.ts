/**
 * File validation utilities for secure file uploads
 * Validates file types using magic bytes (file signatures) instead of relying on MIME types
 */

interface FileSignature {
  signature: number[];
  offset?: number;
  mimeTypes: string[];
  extensions: string[];
}

/**
 * Known file signatures (magic bytes)
 * Source: https://en.wikipedia.org/wiki/List_of_file_signatures
 */
const FILE_SIGNATURES: FileSignature[] = [
  // Images
  {
    signature: [0xFF, 0xD8, 0xFF],
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['jpg', 'jpeg'],
  },
  {
    signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    mimeTypes: ['image/png'],
    extensions: ['png'],
  },
  {
    signature: [0x47, 0x49, 0x46, 0x38],
    mimeTypes: ['image/gif'],
    extensions: ['gif'],
  },
  {
    signature: [0x52, 0x49, 0x46, 0x46],
    mimeTypes: ['image/webp'],
    extensions: ['webp'],
  },
  // PDF
  {
    signature: [0x25, 0x50, 0x44, 0x46],
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
  },
  // ZIP-based files (including .docx, .xlsx, .zip)
  {
    signature: [0x50, 0x4B, 0x03, 0x04],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['zip', 'docx', 'xlsx', 'pptx'],
  },
];

/**
 * Validate file type by checking magic bytes
 * @param buffer - File buffer to validate
 * @param allowedMimeTypes - List of allowed MIME types
 * @returns Object with validation result and detected type
 */
export async function validateFileType(
  buffer: Buffer,
  allowedMimeTypes: string[]
): Promise<{ valid: boolean; detectedType?: string; error?: string }> {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file buffer' };
  }

  // Check if buffer is large enough to contain magic bytes
  if (buffer.length < 8) {
    return { valid: false, error: 'File too small to validate' };
  }

  // Check magic bytes against known signatures
  for (const sig of FILE_SIGNATURES) {
    const offset = sig.offset || 0;
    let matches = true;

    // Check if signature matches
    for (let i = 0; i < sig.signature.length; i++) {
      if (buffer[offset + i] !== sig.signature[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Check if detected type is in allowed list
      const detectedType = sig.mimeTypes[0];
      const isAllowed = sig.mimeTypes.some(type => allowedMimeTypes.includes(type));

      if (isAllowed) {
        return { valid: true, detectedType };
      } else {
        return {
          valid: false,
          detectedType,
          error: `File type ${detectedType} is not allowed`,
        };
      }
    }
  }

  return {
    valid: false,
    error: 'Unknown or unsupported file type',
  };
}

/**
 * Validate image file specifically
 */
export async function validateImageFile(buffer: Buffer): Promise<{
  valid: boolean;
  detectedType?: string;
  error?: string;
}> {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validateFileType(buffer, allowedTypes);
}

/**
 * Validate PDF file specifically
 */
export async function validatePDFFile(buffer: Buffer): Promise<{
  valid: boolean;
  detectedType?: string;
  error?: string;
}> {
  return validateFileType(buffer, ['application/pdf']);
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @param maxSizeMB - Maximum allowed size in megabytes
 */
export function validateFileSize(
  size: number,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File,
  options: {
    allowedMimeTypes: string[];
    maxSizeMB: number;
  }
): Promise<{ valid: boolean; error?: string; detectedType?: string }> {
  // Validate size first (cheaper operation)
  const sizeValidation = validateFileSize(file.size, options.maxSizeMB);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Read file buffer for magic byte validation
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate file type by magic bytes
  return validateFileType(buffer, options.allowedMimeTypes);
}
