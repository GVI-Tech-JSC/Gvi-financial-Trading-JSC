/**
 * VNKR Trade Platform — Backend Entry Point
 * Author: NGUYEN THI THU HUONG
 * Organization: GVI Tech JSC
 * Domain: https://trading.vnkr.vn
 */
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe, VersioningType, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({
    origin: [
      process.env.APP_URL || "http://localhost:3000",
      "https://trading.vnkr.vn",
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableVersioning({ type: VersioningType.URI });

  if (process.env.NODE_ENV !== "production" || process.env.SWAGGER_ENABLED === "true") {
    const config = new DocumentBuilder()
      .setTitle("VNKR Trade API")
      .setDescription("GVI Tech JSC — Trading Platform API · Author: NGUYEN THI THU HUONG")
      .setVersion("1.0.0")
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, doc);
    logger.log("Swagger UI: http://localhost:4000/api/docs");
  }

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port, "0.0.0.0");
  logger.log(`✓ VNKR Backend ready on port ${port} [${process.env.NODE_ENV || "development"}]`);
}

bootstrap();
