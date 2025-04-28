import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { sleep } from '@/utils/tools';
import { puppeteerOpt } from '@/utils/config';

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);

  /**
   * 生成网页长图
   * @param url 网页URL
   * @param outputPath 输出路径，如果不提供则返回Buffer
   * @param options 截图选项
   * @returns 图片Buffer或文件路径
   */
  async generateScreenshot(
    url: string,
    options: {
      outputPath?: string;
      width?: number;
      height?: number;
      deviceScaleFactor?: number;
      selectorEle?: string;
      type?: 'png' | 'jpeg' | 'webp';
      fullPage?: boolean;
      timeout?: number;
    } = {}
  ): Promise<Buffer | string> {
    const {
      outputPath,
      width = 375,
      height = 667,
      deviceScaleFactor = 3.0,
      selectorEle = '#chat-record-detail',
      type = 'png',
      fullPage = true,
      timeout = 60000
    } = options;

    this.logger.log(`开始截图: ${url}`);

    // 启动浏览器
    const browser = await puppeteer.launch(puppeteerOpt);

    try {
      // 创建新页面
      const page = await browser.newPage();

      // 设置超时
      await page.setDefaultNavigationTimeout(timeout);
      await page.setViewport({ width, height });
      // 导航到URL
      await page.goto(url, {
        timeout,
        waitUntil: ['load', 'networkidle0', 'domcontentloaded', 'networkidle2']
      });
      // 等待页面加载完成
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          // 检查页面是否已完全加载
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', () => {
              resolve();
            });
          }
        });
      });
      await page.content();

      await sleep(1000);
      await page.waitForSelector(selectorEle, { timeout });
      const scrollHeight = await page.$eval(selectorEle, (el) => el.scrollHeight);
      // 设置视口大小
      await page.setViewport({ width, height: scrollHeight, deviceScaleFactor });

      // 截图
      const screenshot = await page.screenshot({
        fullPage,
        type,
        encoding: 'binary'
      });

      // 如果提供了输出路径，保存文件
      if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, screenshot);
        this.logger.log(`截图已保存至: ${outputPath}`);
        return outputPath;
      }

      return screenshot as Buffer;
    } catch (error) {
      this.logger.error(`截图失败: ${error.message}`, error.stack);
      throw error;
    } finally {
      // 关闭浏览器
      await browser.close();
    }
  }
}
