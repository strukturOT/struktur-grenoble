import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || 'https://nvvlndtgcmwmxgtlhaxj.supabase.co';
const managementToken = process.env.SUPABASE_ACCESS_TOKEN;
const sourceRoot = path.resolve(process.env.COLLECTION_ROOT || 'NewAmsterdamSurfAssociation');
const brand = 'New Amsterdam Surf Association';

const products = [
  {
    folder: '252 DENIM DARK SPRAY', name: '252 Denim Dark Spray', priceCents: 20000,
    slug: '252-denim-dark-spray', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Relaxed-fit denim trousers with a mid waist and straight leg. Finished with a five-pocket design, dirt wash, branded metal button, rubberised back patch and New Amsterdam embroidery on the coin pocket. Made from 100% cotton denim.',
  },
  {
    folder: 'CPR TEE BURNED ORANGE', name: 'CPR Tee Burned Orange', priceCents: 8000,
    slug: 'cpr-tee-burned-orange', sizes: ['S', 'M', 'L', 'XL'],
    description: 'A regular-fit unisex tee in a heavyweight cotton jersey, finished with the CPR graphic and New Amsterdam Surf Association branding. A versatile everyday layer in a burned orange colorway.',
  },
  {
    folder: 'DENIM OVERSHIRT BLACK', name: 'Denim Overshirt Black', priceCents: 25000,
    slug: 'denim-overshirt-black', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Relaxed-fit raglan denim overshirt with a clean workwear silhouette. It features double-needle stitching, slash front pockets, gun-metal shank buttons, shell-logo chain-stitch embroidery, adjustable side straps and a half cotton lining. Made from 100% cotton.',
  },
  {
    folder: 'DETACHABLE JACKET OLIVE', name: 'Detachable Jacket Olive', priceCents: 29000,
    slug: 'detachable-jacket-olive', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Regular-fit, hip-length padded ripstop jacket with classic onion quilting. Detachable hood and sleeves, a two-way zipper, welt pockets, logo screenprints and an elastic hem drawcord make this a versatile outer layer. Filled with Repreve recycled down.',
  },
  {
    folder: 'Detachable Jacket Black', name: 'Detachable Jacket Black', priceCents: 29000,
    slug: 'detachable-jacket-black', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Regular-fit, hip-length padded ripstop jacket with classic onion quilting. Detachable hood and sleeves, a two-way zipper, welt pockets, logo screenprints and an elastic hem drawcord make this a versatile outer layer. Filled with Repreve recycled down.',
  },
  {
    folder: 'KNITTED STAMP CREWNECK GREY MELANGE', name: 'Knitted Stamp Crewneck Grey Melange', priceCents: 24000,
    slug: 'knitted-stamp-crewneck-grey-melange', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Oversized heavyweight crewneck knit in grey melange with a large stamp-inspired embroidery on the back. Finished with a ribbed neckline, rolled hem and cuffs, and a 10% wool, 55% acrylic, 35% nylon blend.',
  },
  {
    folder: 'TIDE KNIT BURNED ORANGE', name: 'Tide Knit Burned Orange', priceCents: 22000,
    slug: 'tide-knit-burned-orange', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Oversized heavyweight crewneck knit with a leather logo label at the front hem, ribbed neckline and rolled hem and cuffs. Made from a 10% wool, 55% acrylic and 35% nylon blend.',
  },
  {
    folder: 'TIDE KNIT GREY MELANGE', name: 'Tide Knit Grey Melange', priceCents: 22000,
    slug: 'tide-knit-grey-melange', sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Oversized heavyweight crewneck knit with a leather logo label at the front hem, ribbed neckline and rolled hem and cuffs. Made from a 10% wool, 55% acrylic and 35% nylon blend.',
  },
  {
    folder: 'WORK TROUSERS BLACK', name: 'Work Trousers Black', priceCents: 15000,
    slug: 'work-trousers-black', sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Relaxed-fit trousers with a mid waist and straight-leg silhouette. An elasticated waistband with drawcords, front welt pockets, a back patch pocket, branded eyelets and a woven New Amsterdam label complete the design. Made from 100% polyester.',
  },
  {
    folder: 'WORK TROUSERS BURGUNDY', name: 'Work Trousers Burgundy', priceCents: 15000,
    slug: 'work-trousers-burgundy', sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Relaxed-fit trousers with a mid waist and straight-leg silhouette. An elasticated waistband with drawcords, front welt pockets, a back patch pocket, branded eyelets and a woven New Amsterdam label complete the design.',
  },
  {
    folder: 'ZIP UP SHIRT BLACK', name: 'Zip Up Shirt Black', priceCents: 17000,
    slug: 'zip-up-shirt-black', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Relaxed-fit zip-up shirt with dropped shoulders and a hip-length silhouette. Designed with a centre-front zipper, welt pockets, press-button cuffs, shell embroidery and a branded poly/viscose lining in structured polyester twill.',
  },
  {
    folder: 'ZIP UP SHIRT BURGUNDY', name: 'Zip Up Shirt Burgundy', priceCents: 17000,
    slug: 'zip-up-shirt-burgundy', sizes: ['S', 'M', 'L', 'XL'],
    description: 'Relaxed-fit zip-up shirt with dropped shoulders and a hip-length silhouette. Designed with a centre-front zipper, welt pockets, press-button cuffs, shell embroidery and a branded poly/viscose lining in structured polyester twill.',
  },
];

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

const storageUpload = async (bucket, storagePath, body) => {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/avif',
      'x-upsert': 'true',
    },
    body,
  });
  if (!response.ok) throw new Error(`storage ${bucket}/${storagePath} ${response.status}: ${await response.text()}`);
};

const publicUrl = (bucket, storagePath) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

const slugifyFile = (name) => name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const convertToWebp = async (source, directory) => {
  const output = path.join(directory, `${slugifyFile(path.basename(source))}.avif`);
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
    '-vf', "scale='if(gt(iw,ih),min(1800,iw),-2)':'if(gt(ih,iw),min(1800,ih),-2)'",
    '-c:v', 'libsvtav1', '-crf', '35', '-preset', '8', '-frames:v', '1', output,
  ]);
  return readFile(output);
};

const ensureServiceKey = async () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  if (!managementToken) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN before running the import.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: { Authorization: `Bearer ${managementToken}` } });
  if (!response.ok) throw new Error(`Could not read Supabase API keys (${response.status}).`);
  const keys = await response.json();
  // The legacy service_role key is required by the REST/storage endpoints used here.
  // The newer sb_secret key is intentionally not selected because this project still
  // exposes the legacy REST gateway.
  const serviceKey = keys.find((key) => key.id === 'service_role')?.api_key || keys.find((key) => key.type === 'secret')?.api_key;
  if (!serviceKey) throw new Error('No Supabase server key is available for this project.');
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
};

const first = (value) => Array.isArray(value) ? value[0] : value;

const main = async () => {
  await ensureServiceKey();
  const categorySlug = 'new-amsterdam-surf-association';
  const categoryRows = await request(`categories?slug=eq.${encodeURIComponent(categorySlug)}&select=id`);
  const category = first(categoryRows) || first(await request('categories', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([{ name: brand, slug: categorySlug, description: 'New Amsterdam Surf Association — surf-inspired clothing and everyday layers.', position: 0 }]),
  }));
  if (!category?.id) throw new Error('The New Amsterdam category could not be created.');

  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'struktur-new-amsterdam-'));
  let imported = 0;
  let uploaded = 0;
  try {
    for (const product of products) {
      const sourceDirectory = path.join(sourceRoot, product.folder);
      const sourceFiles = (await readdir(sourceDirectory)).filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file)).sort();
      if (!sourceFiles.length) throw new Error(`No images found in ${sourceDirectory}`);

      const productRows = await request(`products?slug=eq.${encodeURIComponent(product.slug)}&select=id`);
      const productRow = first(productRows) || first(await request('products?on_conflict=slug', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify([{
          category_id: category.id,
          name: product.name,
          slug: product.slug,
          brand,
          description: product.description,
          price_cents: product.priceCents,
          currency: 'EUR',
          status: 'active',
          featured: false,
        }]),
      }));
      if (!productRow?.id) throw new Error(`Could not create ${product.name}.`);
      await request(`products?id=eq.${productRow.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ category_id: category.id, name: product.name, brand, description: product.description, price_cents: product.priceCents, status: 'active' }),
      });

      const existingVariants = await request(`product_variants?product_id=eq.${productRow.id}&select=sku`);
      const existingSkus = new Set(existingVariants.map((variant) => variant.sku));
      const newVariants = product.sizes.filter((size) => !existingSkus.has(`${product.slug.toUpperCase()}-${size}`)).map((size, position) => ({
        product_id: productRow.id,
        name: size,
        sku: `${product.slug.toUpperCase()}-${size}`,
        price_cents: product.priceCents,
        stock_quantity: 0,
        position,
      }));
      if (newVariants.length) await request('product_variants', { method: 'POST', body: JSON.stringify(newVariants) });

      const existingImages = await request(`product_images?product_id=eq.${productRow.id}&select=storage_path`);
      const existingPaths = new Set(existingImages.map((image) => image.storage_path));
      for (const [position, filename] of sourceFiles.entries()) {
        const storagePath = `${productRow.id}/${String(position + 1).padStart(3, '0')}-${slugifyFile(filename)}.avif`;
        if (existingPaths.has(storagePath)) continue;
        const buffer = await convertToWebp(path.join(sourceDirectory, filename), tempDirectory);
        await storageUpload('product-images', storagePath, buffer);
        await request('product_images?on_conflict=storage_path', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify([{ product_id: productRow.id, storage_path: storagePath, image_url: publicUrl('product-images', storagePath), alt_text: product.name, position }]),
        });
        uploaded += 1;
      }
      imported += 1;
      console.log(`${product.name}: ${sourceFiles.length} source image(s), ${newVariants.length} new variant(s)`);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
  console.log(`Imported ${imported} products and uploaded ${uploaded} optimized image(s) into category ${category.id}.`);
  console.log('Stock was intentionally set to 0 for every new size; set actual quantities in Admin before taking orders.');
};

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
