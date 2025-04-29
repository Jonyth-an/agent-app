import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './http-exception.filter';
import { ResponseInterceptor } from './response';
import logger from './utils/logger';
import { staticPath, APP_PRIFIX, logPath } from '@/utils/config';
import * as dotenv from 'dotenv';

// 确保环境变量被加载
dotenv.config();
async function bootstrap(port: number) {
  const baseURL = process.env.FETCH_JAVA_BASE_URL;
  console.log('---- baseURL', baseURL);
  // 创建NestFastifyApplication实例
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1048576 // 50MB
    })
  );
  app.setGlobalPrefix(APP_PRIFIX);
  app.useStaticAssets({
    root: [staticPath, logPath],
    prefix: `/${APP_PRIFIX}/static`
  });

  // 使用全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 使用全局拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 创建Swagger文档
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  try {
    // 监听指定端口
    await app.listen(port, '0.0.0.0', () => {
      logger.info(`server is running on: ${port}`);
    });
  } catch (error) {
    logger.error('server running error', error);
  }
}
bootstrap(3007);
