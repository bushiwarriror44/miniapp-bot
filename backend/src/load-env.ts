import { config } from 'dotenv';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });
