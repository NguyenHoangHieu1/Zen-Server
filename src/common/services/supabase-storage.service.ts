import { Injectable } from '@nestjs/common';
import {
  uploadToSupabase,
  deleteFromSupabase,
} from '../utils/supabase.storage';

@Injectable()
export class SupabaseStorageService {
  /**
   * Upload a file (avatar, post image, etc.) to Supabase
   */
  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    folder: string = 'uploads',
  ): Promise<string> {
    return uploadToSupabase({
      file,
      fileName,
      folder,
    });
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const fileName = `${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;
    return this.uploadFile(file, fileName, 'avatars');
  }

  /**
   * Upload post images
   */
  async uploadPostImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const fileName = `${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;
    return this.uploadFile(file, fileName, 'post-images');
  }

  /**
   * Upload group avatar
   */
  async uploadGroupAvatar(
    file: Express.Multer.File,
    groupId: string,
  ): Promise<string> {
    const fileName = `${groupId}-${Date.now()}.${file.originalname.split('.').pop()}`;
    return this.uploadFile(file, fileName, 'group-avatars');
  }

  /**
   * Upload message attachment
   */
  async uploadMessageAttachment(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const fileName = `${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;
    return this.uploadFile(file, fileName, 'message-attachments');
  }

  /**
   * Upload any file to a custom folder
   */
  async uploadToFolder(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    return this.uploadFile(file, fileName, folder);
  }

  /**
   * Delete a file from Supabase storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    await deleteFromSupabase(fileUrl);
  }
}
