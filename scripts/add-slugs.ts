import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { products } from '../server/schema';
import * as dotenv from 'dotenv';

dotenv.config();

function generateSlug(name: string, id: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + id.substring(0, 8);
}

async function addSlugsToProducts() {
  console.log('🔄 Adding slugs to existing products...');

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  try {
    // First, add the slug column if it doesn't exist
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS slug text;
    `;
    console.log('✅ Slug column added/verified');

    // Get all products
    const allProducts = await db.select().from(products);
    console.log(`📦 Found ${allProducts.length} products`);

    // Update each product with a slug
    for (const product of allProducts) {
      if (!product.slug) {
        const slug = generateSlug(product.name, product.id);
        await sql`
          UPDATE products
          SET slug = ${slug}
          WHERE id = ${product.id}
        `;
        console.log(`✅ Added slug "${slug}" to product: ${product.name}`);
      } else {
        console.log(`⏭️  Product already has slug: ${product.name} (${product.slug})`);
      }
    }

    // Add unique constraint
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
    `;
    console.log('✅ Added unique index on slug column');

    // Make slug NOT NULL
    await sql`
      ALTER TABLE products
      ALTER COLUMN slug SET NOT NULL;
    `;
    console.log('✅ Slug column set to NOT NULL');

    console.log('\n🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

addSlugsToProducts();
