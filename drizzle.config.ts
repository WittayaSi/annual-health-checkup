import { defineConfig } from 'drizzle-kit';
import * as fs from 'fs';
import * as path from 'path';

let envDbUrl = process.env.DATABASE_URL;
if (!envDbUrl) {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const match = content.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (match) {
      envDbUrl = match[1];
    }
  }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: envDbUrl || 'mysql://root:password@127.0.0.1:3306/annual_health_checkup',
  },
});
