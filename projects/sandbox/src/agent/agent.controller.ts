import { Controller, Get } from '@nestjs/common';

@Controller('nbagent-sandbox/agent/v1')
export class AgentController {
  @Get('healthy')
  getTest() {
    return { message: 'server is running' };
  }
}
