import { NestFactory } from '@nestjs/core';
import { Client } from 'pg';
import { config } from 'dotenv';
import { AppModule } from './app.module';

config();

async function ensureDatabase(): Promise<void> {
  const dbName = process.env.DB_NAME || 'miniapp_bot';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    const { rows } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created.`);
    }
  } finally {
    await client.end();
  }
}

async function bootstrap() {
  await ensureDatabase();

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((v) => v.trim()) || true,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
