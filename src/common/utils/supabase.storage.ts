import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

let supabaseClient: SupabaseClient;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined in .env');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

export interface SupabaseUploadOptions {
  file: Express.Multer.File | Buffer;
  fileName: string;
  bucket?: string;
  folder?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param options Upload options
 * @returns Public URL of the uploaded file
 */
export async function uploadToSupabase(
  options: SupabaseUploadOptions,
): Promise<string> {
  const {
    file,
    fileName,
    bucket = process.env.SUPABASE_BUCKET || 'zen-storage',
    folder = '',
  } = options;

  const supabase = getSupabaseClient();
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  // Get file buffer - handle both Multer file and raw Buffer
  let fileBuffer: Buffer;
  if ('buffer' in file && Buffer.isBuffer(file.buffer)) {
    fileBuffer = file.buffer;
  } else if (Buffer.isBuffer(file)) {
    fileBuffer = file;
  } else {
    throw new Error('Invalid file type provided');
  }

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType:
        'mimetype' in file ? file.mimetype : 'application/octet-stream',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param fileUrl The public URL of the file to delete
 * @param bucket The storage bucket name
 */
export async function deleteFromSupabase(
  fileUrl: string,
  bucket: string = process.env.SUPABASE_BUCKET || 'zen-storage',
): Promise<void> {
  if (
    !fileUrl ||
    fileUrl.includes('pravatar.cc') ||
    fileUrl.includes('picsum.photos')
  ) {
    return; // Don't try to delete external URLs
  }

  try {
    const supabase = getSupabaseClient();

    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('object') + 2; // After /storage/v1/object/public/{bucket}/
    const filePath = pathParts.slice(bucketIndex).join('/');

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error(`Failed to delete file from Supabase: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
  }
}

/**
 * Download sample images from URLs and upload to Supabase
 * Used for seeding data with real images
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  fileName: string,
  folder: string = 'seed-images',
): Promise<string> {
  try {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Upload to Supabase
    const supabase = getSupabaseClient();
    const bucket = process.env.SUPABASE_BUCKET || 'zen-storage';
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error(`Error downloading and uploading image: ${error.message}`);
    // Fallback to original URL if upload fails
    return imageUrl;
  }
}
