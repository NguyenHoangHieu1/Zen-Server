import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useStaticAssets(`src/uploads/`, { prefix: '/uploads/' });
  app.use(helmet({ crossOriginResourcePolicy: false }));
  await app.listen(3001);
}
bootstrap();
