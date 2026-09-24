import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || 'https://nvvlndtgcmwmxgtlhaxj.supabase.co';
const managementToken = process.env.SUPABASE_ACCESS_TOKEN;
const sourceRoot = path.resolve(process.env.COLLECTION_ROOT || 'Dickies');
const brand = 'Dickies';

// Each colourway is intentionally a separate product so its gallery never shows
// images from another colour. Product names, descriptions, prices and variant
// grids are resolved from Dickies' official EU product feed at import time.
const sources = [
  { folder: '247 LOOSE PANT/black', code: 'DK0A87YPBLK' },
  { folder: '247 LOOSE PANT/dark brown', code: 'DK0A87YP0DB1' },
  { folder: '958 BAGGY TAPERED WORK JEANS VINTAGE VIOLET', code: 'DK0A88EDL79' },
  { folder: 'BAKER HOODIE/black', code: 'DK0A89NSBLK' },
  { folder: 'BAKER SS TEE/Navy blue', code: 'DK0A8DL4BLK', color: 'Navy blue', skuColor: 'NV0' },
  { folder: 'BAKER SS TEE/black', code: 'DK0A8DL4BLK' },
  { folder: 'BRADENTON WAFFLE LS TEE CAMOUFLAGE', code: 'DK0A8D3ECF0' },
  { folder: 'Blanchard camouflage', fallbackKey: 'blanchard-camouflage' },
  { folder: 'Bonnet Lockwood', code: 'DK0A4Z2OBLK' },
  { folder: 'Bonnet gaufré Woodworth', code: 'DK0A4XFDBLK' },
  { folder: 'Casquette baseball Hardwick', code: 'DK0A4TKVL95' },
  { folder: 'Casquette en velours côtelé Hardwick', code: 'DK0A4ZAYBLK' },
  { folder: 'DUCK CANVAS DAD CAP VINTAGE VIOLET', code: 'DK0A87NFL79' },
  { folder: 'FLORENCE OVERSIZED SHACKET TIMBER BROWN', code: 'DK0A8DTD0TB' },
  { folder: 'HOUCK LOOSE STRAIGHT CAMO CANVAS PANTS CAMOUFLAGE', code: 'DK0A8DNCCF0' },
  { folder: 'OAKPORT HOODIE VINTAGE VIOLET/Vintage violet', code: 'DK0A4XCDL79' },
  { folder: 'PAULDEN SHERPA CAMOUFLAGE', code: 'DK0A8D38CF0' },
  { folder: 'SUTCLIFFE HOODIE/black', code: 'DK0A8DQMBLK' },
  { folder: 'SUTCLIFFE HOODIE/dark green', code: 'DK0A8DQMBLK', color: 'Dark green', skuColor: 'B42' },
  { folder: 'SUTCLIFFE ZIPPED HOODIE BLACK', code: 'DK0A8CDJBLK' },
  { folder: 'Sac banane Ashville', code: 'DK0A4Y1UBLK' },
  { folder: 'Sweat Oakport à col zippé/Black', code: 'DK0A4XD4BLK' },
  { folder: 'Sweat Oakport à col zippé/Chocolate Brown', code: 'DK0A4XD4CBX' },
  { folder: 'Sweat Oakport/Deep Depths', code: 'DK0A4XCEL95' },
  { folder: 'Sweat Oakport/black', code: 'DK0A4XCEBLK' },
  { folder: 'Sweatshirt Sutcliffe/black', code: 'DK0A89DMBLK' },
  { folder: 'Sweatshirt Sutcliffe/dark green', code: 'DK0A89DMB42' },
  { folder: 'T-shirt léger Mapleton/vintage violet', code: 'DK0A4XDBL79' },
  { folder: 'T-shirt lourd Sutcliffe/Black', code: 'DK0A89NUBLK' },
  { folder: 'T-shirt lourd Sutcliffe/Dark green', code: 'DK0A89NUB42' },
  { folder: 'T-shirt mi-lourd Shonto', code: 'DK0A8CCLBLK', color: 'Black', filePrefix: 'DK0A8CCLBLK' },
  { folder: 'T-shirt mi-lourd Shonto', code: 'DK0A8CCLC48', color: 'Beige', filePrefix: 'DK0A8CCLC48' },
  { folder: 'T-shirt mi-lourd Titusville', code: 'DK0A8CIMC48' },
  { folder: 'TONOPAH SS TEE BLACK', code: 'DK0A8CD3BLK' },
  { folder: 'WOODWORTH BEANIE BLACK', code: 'DK0A4X7YBLK' },
];

const fallbacks = {
  'DK0A8D3ECF0': {
    title: 'Bradenton Waffle LS Tee', color: 'Camouflage', priceCents: 5890,
    description: 'A relaxed-fit long-sleeve t-shirt in 100% cotton with a structured waffle texture, all-over camouflage print and a back screen print. 220 g/m² cotton.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  'DK0A87NFL79': {
    title: 'Duck Canvas Dad Cap', color: 'Vintage Violet', priceCents: 3500,
    description: 'A hard-wearing everyday dad cap made from cotton duck canvas, finished with an adjustable strapback closure and embroidered Dickies branding.',
    sizes: ['One Size'],
  },
  'DK0A8CD3BLK': {
    title: 'Tonopah Short Sleeve T-Shirt', color: 'Black', priceCents: 4900,
    description: 'A regular-fit short-sleeve t-shirt in 100% cotton with a clean workwear-inspired finish.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  'blanchard-camouflage': {
    title: 'Blanchard Cross Body Bag', color: 'Camouflage', priceCents: 2900,
    description: 'A compact cross-body bag that can be worn around the waist or across the body, with a back pocket for smaller essentials and an adjustable strap.',
    sizes: ['One Size'], skuPrefix: 'DK:0A4X8Q:CAM:OS::1:',
  },
};

const first = (value) => Array.isArray(value) ? value[0] : value;
const normalize = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const stripHtml = (value) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const publicUrl = (bucket, storagePath) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
const imageExtensions = /\.(avif|jpe?g|png|webp)$/i;

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
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'image/avif', 'x-upsert': 'true' },
    body,
  });
  if (!response.ok) throw new Error(`storage ${bucket}/${storagePath} ${response.status}: ${await response.text()}`);
};

const ensureServiceKey = async () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  if (!managementToken) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN before running the import.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: { Authorization: `Bearer ${managementToken}` } });
  if (!response.ok) throw new Error(`Could not read Supabase API keys (${response.status}).`);
  const keys = await response.json();
  const serviceKey = keys.find((key) => key.id === 'service_role')?.api_key || keys.find((key) => key.type === 'secret')?.api_key;
  if (!serviceKey) throw new Error('No Supabase server key is available for this project.');
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
};

const fetchOfficialProducts = async () => {
  const products = [];
  for (let page = 1; page <= 12; page += 1) {
    const response = await fetch(`https://dickies.eu/en-be/products.json?limit=250&page=${page}`);
    if (!response.ok) throw new Error(`Dickies product feed failed (${response.status}).`);
    const body = await response.json();
    products.push(...body.products);
    if (body.products.length < 250) break;
  }
  return products;
};

const convertToAvif = async (source, directory) => {
  const output = path.join(directory, `${slugify(path.basename(source))}.avif`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-vf', "scale='if(gt(iw,ih),min(1800,iw),-2)':'if(gt(ih,iw),min(1800,ih),-2)'", '-c:v', 'libsvtav1', '-crf', '35', '-preset', '8', '-frames:v', '1', output]);
  return readFile(output);
};

const sourceFiles = async (directory, filePrefix) => (await readdir(directory)).filter((file) => imageExtensions.test(file) && (!filePrefix || normalize(file).includes(normalize(filePrefix)))).sort();

const getMetadata = (source, officialProducts) => {
  const fallback = fallbacks[source.fallbackKey || source.code];
  const sourceCode = normalize(source.code);
  const product = source.code ? officialProducts.find((candidate) => candidate.variants.some((variant) => {
    const sku = normalize(variant.sku);
    // Older Dickies filenames include the trailing catalogue revision digit
    // (for example DK0A87YP0DB1), while the live Shopify SKU omits it.
    return sku.includes(sourceCode) || (sourceCode.endsWith('1') && sku.includes(sourceCode.slice(0, -1)));
  })) : null;
  if (!product && !fallback) throw new Error(`No official catalogue match for ${source.folder} (${source.code || source.fallbackKey}).`);
  const base = product ? {
    title: product.title,
    description: stripHtml(product.body_html),
    priceCents: Math.round(Number(product.variants[0].price) * 100),
    variants: product.variants,
  } : fallback;
  const color = source.color || (product?.variants[0]?.title || '').split('/')[0].trim() || base.color;
  const variants = product ? product.variants.map((variant) => {
    const parts = variant.title.split('/').map((part) => part.trim());
    const size = parts.slice(1).join(' / ') || parts[0];
    const sku = source.skuColor ? variant.sku.replace(/:BLK:/i, `:${source.skuColor}:`) : variant.sku;
    return { name: `${color} / ${size}`, sku, priceCents: Math.round(Number(variant.price) * 100) };
  }) : fallback.sizes.map((size, position) => ({ name: `${color} / ${size}`, sku: `${fallback.skuPrefix || `DK:${normalize(source.code || source.fallbackKey)}:`}${position + 1}`, priceCents: fallback.priceCents }));
  return { name: `${base.title} — ${color}`, slug: slugify(`${base.title}-${color}`), description: base.description, priceCents: base.priceCents, variants };
};

const main = async () => {
  await ensureServiceKey();
  const officialProducts = await fetchOfficialProducts();
  const categorySlug = 'dickies';
  const categoryRows = await request(`categories?slug=eq.${categorySlug}&select=id,image_url,storage_path`);
  const category = first(categoryRows) || first(await request('categories', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([{ name: 'Dickies', slug: categorySlug, description: 'Dickies workwear, clothing and accessories.', position: 0 }]) }));
  if (!category?.id) throw new Error('The Dickies category could not be created.');

  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'struktur-dickies-'));
  let imported = 0; let uploaded = 0; let totalSources = 0;
  try {
    for (const source of sources) {
      const directory = path.join(sourceRoot, source.folder);
      const files = await sourceFiles(directory, source.filePrefix);
      if (!files.length) throw new Error(`No images found in ${directory}.`);
      const metadata = getMetadata(source, officialProducts);
      const existingProduct = first(await request(`products?slug=eq.${encodeURIComponent(metadata.slug)}&select=id`));
      const productRow = existingProduct || first(await request('products?on_conflict=slug', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([{ category_id: category.id, name: metadata.name, slug: metadata.slug, brand, description: metadata.description, price_cents: metadata.priceCents, currency: 'EUR', status: 'active', featured: false }]) }));
      if (!productRow?.id) throw new Error(`Could not create ${metadata.name}.`);
      await request(`products?id=eq.${productRow.id}`, { method: 'PATCH', body: JSON.stringify({ category_id: category.id, name: metadata.name, brand, description: metadata.description, price_cents: metadata.priceCents, currency: 'EUR', status: 'active' }) });

      const existingVariants = await request(`product_variants?product_id=eq.${productRow.id}&select=sku`);
      const existingSkus = new Set(existingVariants.map((variant) => variant.sku));
      const newVariants = metadata.variants.filter((variant) => !existingSkus.has(variant.sku)).map((variant, position) => ({ product_id: productRow.id, name: variant.name, sku: variant.sku, price_cents: variant.priceCents, stock_quantity: 0, position }));
      if (newVariants.length) await request('product_variants', { method: 'POST', body: JSON.stringify(newVariants) });

      const existingImages = await request(`product_images?product_id=eq.${productRow.id}&select=storage_path`);
      const existingPaths = new Set(existingImages.map((image) => image.storage_path));
      for (const [position, filename] of files.entries()) {
        const storagePath = `${productRow.id}/${String(position + 1).padStart(3, '0')}-${slugify(filename)}.avif`;
        if (existingPaths.has(storagePath)) continue;
        const imageBuffer = await convertToAvif(path.join(directory, filename), tempDirectory);
        await storageUpload('product-images', storagePath, imageBuffer);
        await request('product_images?on_conflict=storage_path', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([{ product_id: productRow.id, storage_path: storagePath, image_url: publicUrl('product-images', storagePath), alt_text: metadata.name, position }]) });
        uploaded += 1;
        if (!category.image_url) {
          await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: publicUrl('product-images', storagePath), storage_path: storagePath }) });
          category.image_url = publicUrl('product-images', storagePath);
        }
      }
      totalSources += files.length;
      imported += 1;
      console.log(`${metadata.name}: ${files.length} source image(s), ${metadata.variants.length} variant(s), ${newVariants.length} new variant(s)`);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
  console.log(`Imported ${imported} Dickies colourway products, ${totalSources} source image(s), and uploaded ${uploaded} optimized AVIF image(s).`);
  console.log('All new variants start at stock 0. Set actual quantities in Admin before taking orders.');
};

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
