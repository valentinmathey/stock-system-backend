// ======================= NEST CORE ================================
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// ======================== MÓDULOS APP =============================
import { AppModule } from './app.module';

// ======================== SWAGGER DOCS ============================
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// ========================== BOOTSTRAP =============================
async function bootstrap() {
  // Inicializa la aplicación Nest con CORS habilitado
  const app = await NestFactory.create(AppModule, { cors: true });

  // Configuración de CORS (permite todas las origins)
  app.enableCors({
    origin: '*',
    exposedHeaders: ['Content-Range'],
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Stock System')
    .setDescription('The stock system API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Pipe global para validaciones de DTOs
  app.useGlobalPipes(new ValidationPipe());

  // Inicia el servidor en el puerto 3000
  await app.listen(3000);
}

bootstrap();
