import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || 'https://nvvlndtgcmwmxgtlhaxj.supabase.co';
const root = path.resolve('SAUCONY');
const sizes = ['36', '37', '37.5', '38', '38.5', '39', '40', '40.5', '41', '42', '42.5', '43', '44', '44.5', '45', '46'];

const category = {
  name: 'Saucony', slug: 'saucony',
  description: 'Sneakers Saucony au design rétro-running, entre héritage technique, mesh respirant et amorti GRID.',
  position: 5,
};
const groups = [
  {
    folder: 'Shadow 5000', name: 'Shadow 5000', priceCents: 14000,
    description: 'La Saucony Shadow 5000 reprend une silhouette de running des années 1980, pensée aujourd’hui pour un usage quotidien. Sa construction associe mesh et empiècements en suède, avec amorti EVA et semelle extérieure XT-600.',
    colorways: [
      ['S101517-1010', 'S101517-1010', 'Ivory / Pine'], ['S101517-1061', 'S101517-1061', 'Martini / Coca'],
      ['S101517-1062', 'S101517-1062', 'Naval / Pine'], ['S70665-23', 'S70665-23', 'Grey / Grey'], ['S70665-24', 'S70665-24', 'Navy / Grey'],
    ],
  },
  {
    folder: 'PROGRID GUIDE 7', name: 'ProGrid Guide 7', priceCents: 14000,
    description: 'La Saucony ProGrid Guide 7 revisite une chaussure de running de l’ère Y2K dans une silhouette rétro à porter au quotidien. Sa tige en mesh, ses détails réfléchissants et la technologie d’amorti PowerGrid reprennent les éléments caractéristiques du modèle.',
    colorways: [
      ['S101493-1007', 'S101493-1007', 'Trek / Sage'], ['S101493-1051', 'S101493-1051', 'Cadet / Rooibos'],
      ['S101493-1013', 'S101493-1013', 'Silver / Maroon'], ['S101493-1049', 'S101493-1049', 'White / Drupe'],
    ],
  },
  {
    folder: 'PROGRID OMNI 9', name: 'ProGrid Omni 9', priceCents: 16000,
    description: 'La Saucony ProGrid Omni 9 reprend une silhouette technique de running du début des années 2000. Sa tige combine mesh respirant et empiècements de renfort, avec une cage au médio-pied et l’amorti GRID.',
    colorways: [
      ['Mint  Mult', 'SAU-PROGRID-OMNI-9-MINT-MULTI', 'Mint / Multi'], ['Aureate  White', 'SAU-PROGRID-OMNI-9-AUREATE-WHITE', 'Aureate / White'],
      ['gadget pine', 'SAU-PROGRID-OMNI-9-GADGET-PINE', 'Gadget / Pine'], ['Black  Silver', 'SAU-PROGRID-OMNI-9-BLACK-SILVER', 'Black / Silver'],
      ['Cadet  ViZiRed', 'SAU-PROGRID-OMNI-9-CADET-VIZIRED', 'Cadet / ViZiRed'], ['Saddle  Eggshell', 'SAU-PROGRID-OMNI-9-SADDLE-EGGSHELL', 'Saddle / Eggshell'],
      ['Sage  Black', 'SAU-PROGRID-OMNI-9-SAGE-BLACK', 'Sage / Black'], ['Eggshell  Quartz', 'SAU-PROGRID-OMNI-9-EGGSHELL-QUARTZ', 'Eggshell / Quartz'],
    ],
  },
];

const first = (value) => Array.isArray(value) ? value[0] : value;
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const publicUrl = (bucket, storagePath) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
const request = async (endpoint, options = {}) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${endpoint} ${response.status}: ${body}`);
  return body ? JSON.parse(body) : [];
};
const ensureServiceKey = async () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY before importing.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Could not read Supabase project API keys (${response.status}).`);
  const keys = await response.json();
  const serviceKey = keys.find((key) => key.id === 'service_role')?.api_key || keys.find((key) => key.type === 'secret')?.api_key;
  if (!serviceKey) throw new Error('No server-side Supabase key is available for this project.');
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
};
const resolveFolder = async (parent, name) => {
  const entries = await readdir(parent, { withFileTypes: true });
  const found = entries.find((entry) => entry.isDirectory() && slugify(entry.name) === slugify(name));
  if (!found) throw new Error(`Missing Saucony folder: ${path.join(parent, name)}`);
  return path.join(parent, found.name);
};
const convert = (source, destination) => {
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
    '-vf', "scale='if(gt(iw,ih),min(1800,iw),-2)':'if(gt(ih,iw),min(1800,ih),-2)'",
    '-c:v', 'libsvtav1', '-crf', '32', '-preset', '8', '-frames:v', '1', '-map_metadata', '-1', destination,
  ], { stdio: 'ignore' });
  return readFile(destination);
};
const upload = async (storagePath, body) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${storagePath}`, {
    method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/avif', 'x-upsert': 'true' }, body,
  });
  if (!response.ok) throw new Error(`Image upload failed (${response.status}): ${await response.text()}`);
};
const ensureCategory = async () => {
  const rows = await request(`categories?slug=eq.${category.slug}&select=id,image_url,storage_path`);
  let result = first(rows);
  if (!result) result = first(await request('categories?on_conflict=slug', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([category]),
  }));
  if (!result?.id) throw new Error('Could not create Saucony category.');
  await request(`categories?id=eq.${result.id}`, { method: 'PATCH', body: JSON.stringify({ name: category.name, description: category.description, position: category.position }) });
  return result;
};

const main = async () => {
  const plan = [];
  for (const group of groups) {
    const parent = await resolveFolder(root, group.folder);
    const flat = group.folder !== 'PROGRID OMNI 9';
    const colorways = [];
    for (const [sourceFolder, skuBase, colorway] of group.colorways) {
      const folder = flat ? parent : await resolveFolder(parent, sourceFolder);
      const files = (await readdir(folder)).filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file));
      const images = files.filter((file) => !flat || file.toLowerCase().startsWith(`${sourceFolder.toLowerCase()}_`)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
      if (!images.length) throw new Error(`No images found for ${group.name} / ${colorway}.`);
      colorways.push({ folder, images, skuBase, colorway });
    }
    const variants = colorways.flatMap((color, colorPosition) => sizes.map((size, sizePosition) => ({
      name: size,
      sku: `${color.skuBase}-EU${size}`,
      priceCents: group.priceCents,
      attributes: { colorway: color.colorway, colorCode: color.skuBase, size },
      position: colorPosition * 100 + sizePosition,
    })));
    const images = colorways.flatMap((color, colorPosition) => color.images.map((file, imagePosition) => ({
      colorway: color.colorway, folder: color.folder, file,
      position: colorPosition * 100 + imagePosition,
      altText: `${group.name} — ${color.colorway} — Vue ${imagePosition + 1}`,
    })));
    plan.push({ ...group, slug: slugify(group.name), variants, images });
  }
  const photoCount = plan.reduce((count, item) => count + item.images.length, 0);
  if (plan.length !== 3 || photoCount !== 101) throw new Error(`Expected 3 models / 101 photos; mapped ${plan.length} models / ${photoCount} photos.`);
  for (const item of plan) console.log(`[${process.env.DRY_RUN === '1' ? 'dry-run' : 'plan'}] ${item.name} · ${item.colorways.length} colorways · ${item.variants.length} size/color variants · ${item.images.length} photos · €${(item.priceCents / 100).toFixed(2)}`);
  console.log(`Validated ${plan.length} model products, ${photoCount} images, and ${plan.reduce((count, item) => count + item.variants.length, 0)} color/size variants.`);
  if (process.env.DRY_RUN === '1') return;

  await ensureServiceKey();
  const temp = await mkdtemp(path.join(tmpdir(), 'struktur-saucony-'));
  try {
    const cat = await ensureCategory();
    for (const item of plan) {
      const payload = { category_id: cat.id, name: item.name, slug: item.slug, brand: 'Saucony', description: item.description, price_cents: item.priceCents, currency: 'EUR', status: 'active', featured: false };
      let product = first(await request(`products?slug=eq.${item.slug}&select=id`));
      if (!product) product = first(await request('products?on_conflict=slug', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([payload]) }));
      if (!product?.id) throw new Error(`Could not create ${item.name}.`);
      await request(`products?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify(payload) });

      const existingVariants = await request(`product_variants?product_id=eq.${product.id}&select=id,sku`);
      const bySku = new Map(existingVariants.map((variant) => [variant.sku, variant.id]));
      for (const variant of item.variants) {
        const values = { name: variant.name, price_cents: variant.priceCents, attributes: variant.attributes, position: variant.position };
        const id = bySku.get(variant.sku);
        if (id) await request(`product_variants?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(values) });
        else await request('product_variants', { method: 'POST', body: JSON.stringify([{ ...values, sku: variant.sku, product_id: product.id, stock_quantity: 0 }]) });
      }

      const existingImages = await request(`product_images?product_id=eq.${product.id}&select=id,alt_text,storage_path`);
      const byAlt = new Map(existingImages.filter((image) => image.alt_text).map((image) => [image.alt_text, image]));
      for (const image of item.images) {
        const existing = byAlt.get(image.altText);
        if (existing) {
          await request(`product_images?id=eq.${existing.id}`, { method: 'PATCH', body: JSON.stringify({ position: image.position }) });
          continue;
        }
        const sourceName = slugify(path.basename(image.file, path.extname(image.file)));
        const storagePath = `${product.id}/saucony-${slugify(image.colorway)}-${String(image.position).padStart(3, '0')}-${sourceName}.avif`;
        const convertedPath = path.join(temp, `${product.id}-${image.position}.avif`);
        await upload(storagePath, await convert(path.join(image.folder, image.file), convertedPath));
        await request('product_images?on_conflict=storage_path', {
          method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify([{ product_id: product.id, storage_path: storagePath, image_url: publicUrl('product-images', storagePath), alt_text: image.altText, position: image.position }]),
        });
        if (!cat.image_url) {
          cat.image_url = publicUrl('product-images', storagePath);
          await request(`categories?id=eq.${cat.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: cat.image_url, storage_path: storagePath }) });
        }
      }
      console.log(`Synchronized ${item.name}: ${item.colorways.length} colorways, ${item.images.length} images.`);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log('Saucony model-level catalog sync complete. Existing stock counts were preserved; new variant sizes default to 0.');
};

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
