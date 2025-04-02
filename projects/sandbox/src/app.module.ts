import { Module } from '@nestjs/common';
import { SandboxController } from './sandbox/sandbox.controller';
import { SandboxService } from './sandbox/sandbox.service';
import { AgentModule } from './agent/agent.module';
import { ScreenshotModule } from './screenshot/screenshot.module';

@Module({
  imports: [AgentModule, ScreenshotModule],
  controllers: [SandboxController],
  providers: [SandboxService]
})
export class AppModule {}
