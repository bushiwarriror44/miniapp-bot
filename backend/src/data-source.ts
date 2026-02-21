import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const isCompiled = __dirname.endsWith('dist');
const ext = isCompiled ? '.js' : '.ts';
const entitiesDir = __dirname + (isCompiled ? '/entities' : '/entities');
const migrationsDir = __dirname + (isCompiled ? '/migrations' : '/migrations');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'miniapp_bot',
  entities: [entitiesDir + '/*.entity' + ext],
  migrations: [migrationsDir + '/*' + ext],
  synchronize: false,
});
