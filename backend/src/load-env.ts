import { config } from 'dotenv';
import * as path from 'path';

/**
 * Load backend/.env before any other module (e.g. AppModule) reads process.env.
 * main.ts must import this file as its first import.
 */
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });
