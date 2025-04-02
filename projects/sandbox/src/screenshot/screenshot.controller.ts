import { Controller, Post, Body, Res, HttpStatus, Query, Get } from '@nestjs/common';
import { FastifyReply } from 'fastify'; // 修改导入
import { ScreenshotService } from './screenshot.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('screenshot')
export class ScreenshotController {
  constructor(private readonly screenshotService: ScreenshotService) {}
  @Get('healthy')
  getTest() {
    return { message: 'screenshot is running' };
  }
  @Post()
  async takeScreenshot(
    @Body() body: { url: string; width?: number; height?: number; fullPage?: boolean },
    @Res() res: FastifyReply // 修改类型
  ) {
    try {
      const { url, width, height, fullPage } = body;

      if (!url) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: '请提供URL' });
      }

      // 生成唯一文件名
      const fileName = `screenshot_${Date.now()}.png`;
      const outputDir = path.join(process.cwd(), 'static/uploads', 'screenshots');
      const outputPath = path.join(outputDir, fileName);

      // 确保目录存在
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 生成截图
      await this.screenshotService.generateScreenshot(url, outputPath, { width, height, fullPage });

      // 返回文件URL
      const fileUrl = `/screenshots/${fileName}`;
      // 修改响应方式
      return res.status(HttpStatus.OK).send({
        message: '截图成功',
        url: fileUrl
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: '截图失败',
        error: error.message
      });
    }
  }

  @Get()
  async getScreenshot(
    @Query('url') url: string,
    @Query('width') width: number,
    @Query('height') height: number,
    @Query('fullPage') fullPage: boolean,
    @Res() res: FastifyReply // 修改类型
  ) {
    try {
      if (!url) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: '请提供URL' });
      }

      // 直接返回截图
      const screenshot = await this.screenshotService.generateScreenshot(url, undefined, {
        width: width ? parseInt(width.toString()) : undefined,
        height: height ? parseInt(height.toString()) : undefined,
        fullPage: fullPage === undefined ? true : fullPage
      });

      res.header('Content-Type', 'image/png');
      res.header('Content-Disposition', `inline; filename="screenshot.png"`);
      return res.send(screenshot);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: '截图失败',
        error: error.message
      });
    }
  }
}
