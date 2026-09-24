import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || 'https://nvvlndtgcmwmxgtlhaxj.supabase.co';
const managementToken = process.env.SUPABASE_ACCESS_TOKEN;
const brand = 'Dickies';
const imageExtensions = /\.(avif|jpe?g|png|webp)$/i;

const collections = [
  {
    root: path.resolve('Dickies 2eme partie'),
    category: { name: 'Dickies', slug: 'dickies', description: 'Dickies workwear, vêtements et accessoires.', position: 0 },
    products: [
      { folders: ['Chemise de travail manches longues', 'NOIR'], code: 'DK0A4Y26BLK', title: 'Long Sleeve Work Shirt' },
      { folders: ['Chemise de travail manches longues', 'KAKI'], code: 'DK0A4Y26L17', title: 'Long Sleeve Work Shirt', color: 'Khaki', replaceSkuColor: ['L17', 'KHK'] },
      { folders: ['Pantalon de travail 874 original (unisexe)', 'KAKI'], code: 'DK0A4XK6KHK', title: 'Original 874 Work Pant (Unisex)' },
      { folders: ['Pantalon de travail 874 original (unisexe)', 'NOIR'], code: 'DK0A4XK6BLK', title: 'Original 874 Work Pant (Unisex)' },
      { folders: ['Veste duck canvas 758', 'BLACK'], code: 'DK0A8DEVBLK', title: '758 Duck Jacket' },
      { folders: ['Veste duck canvas 758', 'BROWN DUCK'], code: 'DK0A8DEV0BD', title: '758 Duck Jacket' },
    ],
  },
  {
    root: path.resolve('Dickies Premium'),
    category: { name: 'Dickies Premium', slug: 'dickies-premium', description: 'La sélection premium Dickies : pièces emblématiques, matières renforcées et silhouettes workwear.', position: 1 },
    products: [
      { folders: ['Sweat à capuche Clewiston', 'BLACK'], code: 'DK0A8E4YBLK', title: 'Clewiston Pullover Hoodie' },
      { folders: ['Sweat à capuche Clewiston', 'Maroon'], code: 'DK0A8E4YMR0', title: 'Clewiston Pullover Hoodie' },
      { folders: ['T-shirt lourd Mineral', 'BEIGE'], code: 'DK0A87QEC48', title: 'Mineral Heavyweight T-Shirt' },
      { folders: ['T-shirt lourd Mineral', 'MARRON'], code: 'DK0A87QEMR0', title: 'Mineral Heavyweight T-Shirt' },
      { folders: ['T-shirt lourd Mineral', 'NOIR'], code: 'DK0A87QEBLK', title: 'Mineral Heavyweight T-Shirt' },
      { folders: ['Veste Eisenhower doublée', 'BLACK'], code: 'DK0A4XK4BLK', title: 'Lined Eisenhower Jacket' },
      { folders: ['Veste Eisenhower doublée', 'CHOCOLATE BROWN'], code: 'DK0A4XK40CB', title: 'Lined Eisenhower Jacket' },
      { folders: ['Veste Eisenhower doublée', 'TIBETAN RED'], code: 'DK0A4XK4K74', title: 'Lined Eisenhower Jacket' },
      { folders: ['Veste en flanelle Taylor'], code: 'DK0A8DNJBLK', title: 'Taylor Flannel Jacket' },
    ],
  },
];

const first = (value) => Array.isArray(value) ? value[0] : value;
const normalize = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stripHtml = (value) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const publicUrl = (bucket, storagePath) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${endpoint} ${response.status}: ${body}`);
  return body ? JSON.parse(body) : [];
};

const storageUpload = async (storagePath, body) => {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${storagePath}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/avif',
      'x-upsert': 'true',
    },
    body,
  });
  if (!response.ok) throw new Error(`Storage upload ${storagePath} failed (${response.status}): ${await response.text()}`);
};

const ensureServiceKey = async () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  if (!managementToken) throw new Error('Set SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY before running the import.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: { Authorization: `Bearer ${managementToken}` } });
  if (!response.ok) throw new Error(`Could not read the Supabase project API keys (${response.status}).`);
  const keys = await response.json();
  const serviceKey = keys.find((key) => key.id === 'service_role')?.api_key || keys.find((key) => key.type === 'secret')?.api_key;
  if (!serviceKey) throw new Error('No server-side Supabase key is available for this project.');
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
};

const fetchOfficialProducts = async () => {
  const products = [];
  for (let page = 1; page <= 12; page += 1) {
    const response = await fetch(`https://dickies.eu/en-be/products.json?limit=250&page=${page}`);
    if (!response.ok) throw new Error(`Dickies public product feed failed (${response.status}).`);
    const body = await response.json();
    products.push(...body.products);
    if (body.products.length < 250) break;
  }
  return products;
};

const resolveDirectory = async (root, folderNames) => {
  let directory = root;
  for (const expected of folderNames) {
    const entries = await readdir(directory, { withFileTypes: true });
    const match = entries.find((entry) => entry.isDirectory() && slugify(entry.name) === slugify(expected));
    if (!match) throw new Error(`Folder not found: ${path.join(directory, expected)}`);
    directory = path.join(directory, match.name);
  }
  return directory;
};

const sourceImages = async (directory) => (await readdir(directory))
  .filter((file) => imageExtensions.test(file))
  .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }));

const convertToAvif = async (source, output) => {
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
    '-vf', "scale='if(gt(iw,ih),min(1800,iw),-2)':'if(gt(ih,iw),min(1800,ih),-2)'",
    '-c:v', 'libsvtav1', '-crf', '35', '-preset', '8', '-frames:v', '1', output,
  ], { stdio: 'ignore' });
  return readFile(output);
};

const metadataFor = (source, officialProducts) => {
  const sourceCode = normalize(source.code);
  const official = officialProducts.find((product) => product.variants.some((variant) => normalize(variant.sku).includes(sourceCode)));
  if (!official) throw new Error(`No official Dickies catalogue match for ${source.code}.`);
  const officialColor = official.variants[0]?.title.split('/')[0].trim();
  const color = source.color || officialColor;
  const variants = official.variants.map((variant) => {
    const parts = variant.title.split('/').map((part) => part.trim());
    const option = parts.slice(1).join(' / ') || parts[0];
    let sku = variant.sku;
    if (source.replaceSkuColor) sku = sku.replace(`:${source.replaceSkuColor[0]}:`, `:${source.replaceSkuColor[1]}:`);
    return { name: `${color} / ${option}`, sku, priceCents: Math.round(Number(variant.price) * 100) };
  });
  return {
    name: `${source.title} — ${color}`,
    slug: slugify(`${source.title}-${color}`),
    description: stripHtml(official.body_html),
    priceCents: Math.round(Number(official.variants[0].price) * 100),
    variants,
  };
};

const ensureCategory = async (categoryInput) => {
  const rows = await request(`categories?slug=eq.${encodeURIComponent(categoryInput.slug)}&select=id,image_url,storage_path`);
  const category = first(rows) || first(await request('categories?on_conflict=slug', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([categoryInput]),
  }));
  if (!category?.id) throw new Error(`Could not create category ${categoryInput.name}.`);
  await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ name: categoryInput.name, description: categoryInput.description, position: categoryInput.position }) });
  return category;
};

const main = async () => {
  const officialProducts = await fetchOfficialProducts();
  if (process.env.DRY_RUN === '1') {
    const slugs = new Set();
    let images = 0;
    for (const collection of collections) {
      for (const source of collection.products) {
        const sourceDirectory = await resolveDirectory(collection.root, source.folders);
        const files = await sourceImages(sourceDirectory);
        const metadata = metadataFor(source, officialProducts);
        if (slugs.has(metadata.slug)) throw new Error(`Duplicate generated slug: ${metadata.slug}`);
        slugs.add(metadata.slug);
        images += files.length;
        console.log(`[dry-run] ${collection.category.name} · ${metadata.name}: €${(metadata.priceCents / 100).toFixed(2)}, ${metadata.variants.length} variant(s), ${files.length} image(s).`);
      }
    }
    console.log(`[dry-run] Validated ${slugs.size} products and ${images} source images.`);
    return;
  }

  await ensureServiceKey();
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'struktur-dickies-expansion-'));
  let imported = 0;
  let sourceImageCount = 0;
  let uploaded = 0;

  try {
    for (const collection of collections) {
      const category = await ensureCategory(collection.category);
      for (const source of collection.products) {
        const sourceDirectory = await resolveDirectory(collection.root, source.folders);
        const images = await sourceImages(sourceDirectory);
        if (!images.length) throw new Error(`No images found in ${sourceDirectory}.`);
        const metadata = metadataFor(source, officialProducts);

        const existing = first(await request(`products?slug=eq.${encodeURIComponent(metadata.slug)}&select=id`));
        const product = existing || first(await request('products?on_conflict=slug', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify([{
            category_id: category.id,
            name: metadata.name,
            slug: metadata.slug,
            brand,
            description: metadata.description,
            price_cents: metadata.priceCents,
            currency: 'EUR',
            status: 'active',
            featured: false,
          }]),
        }));
        if (!product?.id) throw new Error(`Could not create ${metadata.name}.`);

        await request(`products?id=eq.${product.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ category_id: category.id, name: metadata.name, brand, description: metadata.description, price_cents: metadata.priceCents, currency: 'EUR', status: 'active' }),
        });

        const currentVariants = await request(`product_variants?product_id=eq.${product.id}&select=sku`);
        const currentSkus = new Set(currentVariants.map((variant) => variant.sku));
        const newVariants = metadata.variants.filter((variant) => !currentSkus.has(variant.sku)).map((variant, position) => ({
          product_id: product.id,
          name: variant.name,
          sku: variant.sku,
          price_cents: variant.priceCents,
          stock_quantity: 0,
          position,
        }));
        if (newVariants.length) await request('product_variants', { method: 'POST', body: JSON.stringify(newVariants) });

        const currentImages = await request(`product_images?product_id=eq.${product.id}&select=storage_path`);
        const currentPaths = new Set(currentImages.map((image) => image.storage_path));
        for (const [position, filename] of images.entries()) {
          const sourceKey = slugify(`${source.code}-${filename}`);
          const storagePath = `${product.id}/dickies-expansion-${String(position + 1).padStart(3, '0')}-${sourceKey}.avif`;
          if (currentPaths.has(storagePath)) continue;
          const convertedPath = path.join(tempDirectory, `${product.id}-${String(position + 1).padStart(3, '0')}.avif`);
          const buffer = await convertToAvif(path.join(sourceDirectory, filename), convertedPath);
          await storageUpload(storagePath, buffer);
          await request('product_images?on_conflict=storage_path', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify([{
              product_id: product.id,
              storage_path: storagePath,
              image_url: publicUrl('product-images', storagePath),
              alt_text: `${metadata.name} chez STRUKTUR Grenoble`,
              position,
            }]),
          });
          uploaded += 1;
          if (!category.image_url) {
            await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: publicUrl('product-images', storagePath), storage_path: storagePath }) });
            category.image_url = publicUrl('product-images', storagePath);
          }
        }

        imported += 1;
        sourceImageCount += images.length;
        console.log(`${collection.category.name} · ${metadata.name}: ${images.length} image(s), ${metadata.variants.length} size variant(s), ${newVariants.length} new.`);
      }
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }

  console.log(`Imported ${imported} colourway products from ${sourceImageCount} source images; uploaded ${uploaded} optimized AVIF files.`);
  console.log('All new size variants start at stock 0. Set the physical quantities in Admin before selling them.');
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
