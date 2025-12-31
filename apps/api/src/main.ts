import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from 'cookie-parser';
import { AppModule } from "./app.module";
import { urlConfig } from "lib/url-config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strips unknown fields
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: urlConfig.appUrl,
    credentials: true,
  });

  app.use(cookieParser());
  
  await app.listen(3001);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
