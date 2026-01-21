import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'DeliGourmet API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      service: 'DeliGourmet Backend',
      version: '1.0.0',
    };
  }
}
