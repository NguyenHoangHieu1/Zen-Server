import { Process, Processor } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { Job } from 'bull';
import sharp from 'sharp';
@Processor('resize-image')
export class ResizeImageProcessor {
  @Process('resize-one-image')
  async resizeImage(job: Job<{ file: Express.Multer.File }>) {
    try {
      await sharp(job.data.file.buffer)
        .resize({ width: 800, height: 600 })
        .png({ quality: 70 })
        .jpeg({ quality: 70 })
        .toFile(`../../../uploads/${job.data.file.filename}`, (err, file) => {
          if (err) {
            throw new BadRequestException('Something wrong');
          }
        });
    } catch (error) { }
  }
}
