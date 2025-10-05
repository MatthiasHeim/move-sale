import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkSlugs() {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`SELECT id, name, slug FROM products LIMIT 3`;
  console.log('Database check:');
  result.forEach(r => {
    console.log(`- ${r.id.substring(0, 20)}... | ${r.name.substring(0, 40)}... | slug: ${r.slug || 'NULL'}`);
  });
}

checkSlugs();
