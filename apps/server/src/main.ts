import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Client } from 'pg';

async function ensureB2bDatabase(): Promise<void> {
  const name = process.env.B2B_DB_NAME;
  if (!name) return;
  const host = process.env.B2B_DB_HOST || process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.B2B_DB_PORT || process.env.DB_PORT || '5432', 10);
  const user = process.env.B2B_DB_USER || process.env.DB_USER || 'canchas';
  const password = process.env.B2B_DB_PASSWORD || process.env.DB_PASSWORD || 'canchas';
  const maintenance = process.env.DB_NAME || 'postgres';
  let client: Client | null = null;
  try {
    client = new Client({
      host,
      port,
      user,
      password,
      database: maintenance,
      ssl: process.env.B2B_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    await client.connect();
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (found.rowCount === 0) {
      const safeName = name.replace(/"/g, '');
      await client.query('CREATE DATABASE "' + safeName + '"');
      console.log('[b2b] Base "' + name + '" creada en la instancia compartida.');
    } else {
      console.log('[b2b] Base "' + name + '" ya existe.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('[b2b] No se pudo verificar/crear la base "' + name + '": ' + message);
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

async function bootstrap() {
  await ensureB2bDatabase();
  const app = await NestFactory.create(AppModule);
  const corsOrigins = process.env.CORS_ORIGIN
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors(corsOrigins?.length ? { origin: corsOrigins } : undefined);

  const config = new DocumentBuilder()
    .setTitle('API de El Pizarrón del DT')
    .setDescription('Documentación de la API para el backend del juego.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
  customSiteTitle: 'Documentación El Pizarrón del DT',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
  ],
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  ],
});

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
