import { Query, Req, Controller, Get } from '@nestjs/common';
import { Request } from 'express';
@Controller('share-sandbox/agent/v1')
export class AgentController {
  @Get('healthy')
  getTest() {
    return { message: 'server is running' };
  }

  @Get('init')
  getInit(@Query('appId') appId: string, @Req() req: Request) {
    const openid = req.cookies['openid'];
    const unionid = req.cookies['unionid'];

    if (!appId || !openid || !unionid) {
      return { error: 'Missing required parameters' };
    }

    // 这里可以添加你的业务逻辑
    return {
      message: 'Init successful',
      appId,
      openid,
      unionid
    };
  }
}
