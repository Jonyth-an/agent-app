import { Module } from '@nestjs/common';
import { ScreenshotController } from './screenshot.controller';
import { ScreenshotService } from './screenshot.service';
import { UploadService } from '../upload/upload.service';
@Module({
  controllers: [ScreenshotController],
  providers: [ScreenshotService, UploadService],
  exports: [ScreenshotService]
})
export class ScreenshotModule {}
