import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, stat, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || 'https://nvvlndtgcmwmxgtlhaxj.supabase.co';
const root = path.resolve('the new modifs 28 oct');
const source = JSON.parse(await readFile(new URL('./data/october-2026-products.json', import.meta.url), 'utf8'));
const imageExtension = /\.(avif|jpe?g|png|webp)$/i;
const normalize = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const first = (rows) => rows[0];
const publicUrl = (storagePath) => `${supabaseUrl}/storage/v1/object/public/product-images/${storagePath}`;
const categories = {
  'Pierre Bassene World': { name: 'Pierre Bassene World', slug: 'pierre-bassene-world', description: 'Le vestiaire Pierre Bassene World : motifs Camo, vestes, maille et silhouettes contemporaines.', position: 9 },
  'Hélas': { name: 'Hélas', slug: 'helas', description: 'La sélection Hélas : vêtements, maille, denim, casquettes et bonnets de la marque de skate française.', position: 10 },
  Sorel: { name: 'Sorel', slug: 'sorel', description: 'Les chaussures Sorel de la sélection STRUKTUR : Callsign, Daystorm et collaboration Sorel × Aries.', position: 11 },
};
const sizeNames = { small: 'S', medium: 'M', large: 'L', xsmall: 'XS', xlarge: 'XL', xxlarge: 'XXL', onesize: 'Taille unique' };
const sizeLabel = (size) => sizeNames[normalize(size)] || (/ EU$/.test(size) ? `EU ${size.replace(/ EU$/, '')}` : size.toUpperCase());

async function filesIn(folder) {
  return (await readdir(folder)).filter((file) => imageExtension.test(file));
}

function imagePriority(file) {
  if (/_m(?:_tt)?\.avif$/i.test(file)) return 0;
  if (/(?:^|_)front(?:_|\.)/i.test(file)) return 0;
  if (/_01 \(1\)\./i.test(file)) return 0;
  if (/(?:^|_)back(?:_|\.)/i.test(file)) return 3;
  if (/detail/i.test(file)) return 4;
  return 1;
}

async function planImport() {
  const pbwRoot = path.join(root, 'PierreBasseneWorld');
  const helasRoot = path.join(root, 'transfer-01a17d7a', 'HELAS');
  const sorelRoot = path.join(root, 'transfer-01a17d7a', 'SOREL');
  const pbwFolders = (await readdir(pbwRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const helasFiles = await filesIn(helasRoot);
  const sorelFolders = (await readdir(sorelRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const sorelFiles = await Promise.all(sorelFolders.map(async (entry) => ({ name: entry.name, files: await filesIn(path.join(sorelRoot, entry.name)) })));
  const plan = [];
  const assignedFiles = new Set();
  for (const product of source.products) {
    let folder;
    let files;
    let name = product.name;
    let code = product.styleCode;
    if (product.brand === 'Pierre Bassene World') {
      const match = pbwFolders.find((entry) => normalize(entry.name) === normalize(product.sourceLabel));
      if (!match) throw new Error(`No source folder for ${product.sourceLabel}`);
      folder = path.join(pbwRoot, match.name);
      files = await filesIn(folder);
    } else if (product.brand === 'Hélas') {
      folder = helasRoot;
      files = helasFiles.filter((file) => normalize(file.replace(/_\d+ \(1\)\.\w+$/i, '').replace(/^FA26_/, '')) === normalize(product.sourceLabel));
    } else if (product.brand === 'Sorel') {
      const id = product.sourceLabel.match(/(\d{7})_(\d{3})$/);
      if (!id) throw new Error(`Missing Sorel article/colour code: ${product.sourceLabel}`);
      code = `${id[1]}-${id[2]}`;
      const match = sorelFiles.find((entry) => entry.files.some((file) => file.startsWith(`${id[1]}_${id[2]}_`)));
      if (!match) throw new Error(`No Sorel images for ${code}`);
      folder = path.join(sorelRoot, match.name);
      files = match.files;
      if (files.some((file) => !file.startsWith(`${id[1]}_${id[2]}_`))) throw new Error(`Mixed Sorel colour images in ${match.name}`);
      const models = { '2178061': 'Callsign™ Daybreak LX', '2142961': 'Callsign Horizon™ Low GTX®', '2167551': 'Daystorm™ Nomad GTX®', '2201101': 'Sorel × Aries Daystorm™ Chukka' };
      const colour = match.name.split(' - ').at(-1).normalize('NFC').replaceAll(', ', ' / ');
      name = `${models[id[1]]} — ${colour}`;
    } else throw new Error(`Unmapped brand ${product.brand}`);
    if (!files.length) throw new Error(`No images for ${product.sourceLabel}`);
    files.sort((a, b) => imagePriority(a) - imagePriority(b) || a.localeCompare(b, 'fr', { numeric: true }));
    for (const file of files) {
      const absolute = path.join(folder, file);
      if (assignedFiles.has(absolute)) throw new Error(`Photo assigned to multiple products: ${absolute}`);
      assignedFiles.add(absolute);
    }
    const prefix = product.brand === 'Hélas' ? 'helas' : product.brand === 'Sorel' ? 'sorel' : 'pierre-bassene';
    const slug = slugify((name.toLowerCase().startsWith('sorel') ? name : `${prefix}-${name}`).replaceAll('×', 'x'));
    const officialSkuCounts = Object.values(product.variantSkus).reduce((map, sku) => map.set(sku, (map.get(sku) || 0) + 1), new Map());
    const variants = product.sizes.map((size, position) => {
      const officialSku = product.variantSkus[size];
      const sku = officialSku ? (officialSkuCounts.get(officialSku) > 1 ? `${officialSku}-${slugify(size).toUpperCase()}` : officialSku) : `${prefix.toUpperCase()}-${code || slug}-${slugify(size).toUpperCase()}`;
      return { name: sizeLabel(size), sku, price_cents: product.priceCents, attributes: { size: sizeLabel(size) }, position };
    });
    plan.push({ ...product, name, slug, folder, files, variants });
  }
  const allPhotos = [
    ...helasFiles.map((file) => path.join(helasRoot, file)),
    ...(await Promise.all(pbwFolders.map(async (entry) => (await filesIn(path.join(pbwRoot, entry.name))).map((file) => path.join(pbwRoot, entry.name, file))))).flat(),
    ...sorelFiles.flatMap((entry) => entry.files.map((file) => path.join(sorelRoot, entry.name, file))),
  ];
  const unassigned = allPhotos.filter((file) => !assignedFiles.has(file));
  if (unassigned.length) throw new Error(`Unassigned product images: ${unassigned.join(', ')}`);
  if (plan.length !== 27 || new Set(plan.map((item) => item.slug)).size !== 27) throw new Error('Expected 27 unique product slugs.');
  const skus = plan.flatMap((product) => product.variants.map((variant) => variant.sku));
  if (new Set(skus).size !== skus.length) throw new Error('Duplicate variant SKU in import plan.');
  return plan;
}

async function ensureServerKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error('Set SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` } });
  if (!response.ok) throw new Error(`Supabase authentication failed (${response.status}).`);
  const keys = await response.json();
  const key = keys.find((item) => item.id === 'service_role')?.api_key || keys.find((item) => item.type === 'secret')?.api_key;
  if (!key) throw new Error('No Supabase server key available.');
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
}

async function request(endpoint, options = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`Supabase ${endpoint}: ${response.status} ${await response.text()}`);
  const body = await response.text();
  return body ? JSON.parse(body) : [];
}

async function ensureCategory(definition) {
  const existing = first(await request(`categories?slug=eq.${definition.slug}&select=id,image_url,storage_path`));
  return existing || first(await request('categories', { method: 'POST', body: JSON.stringify([definition]) }));
}

const imageInfo = (input) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,pix_fmt', '-of', 'json', input], { encoding: 'utf8' })).streams[0];
const hasAlpha = (info) => /rgba|bgra|argb|abgr|yuva|gbrap|ya8|ya16|ayuv|vuya|pal8/i.test(info.pix_fmt || '');

async function optimizedImage(input, output, info = imageInfo(input)) {
  const original = await stat(input);
  if (/\.avif$/i.test(input) && Math.max(info.width, info.height) <= 1800 && original.size <= 450 * 1024) {
    return { body: await readFile(input), sourceBytes: original.size };
  }
  const scale = Math.min(1, 1800 / Math.max(info.width, info.height));
  let width = Math.max(2, Math.floor(info.width * scale / 2) * 2);
  let height = Math.max(2, Math.floor(info.height * scale / 2) * 2);
  let body;
  for (const crf of [34, 39, 44]) {
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-f', 'lavfi', '-i', `color=c=white:s=${width}x${height}`, '-filter_complex', `[0:v]scale=${width}:${height}[photo];[1:v][photo]overlay=shortest=1:format=auto,format=yuv420p`, '-c:v', 'libsvtav1', '-crf', String(crf), '-preset', '8', '-frames:v', '1', '-map_metadata', '-1', output], { stdio: 'ignore' });
    body = await readFile(output);
    if (body.length <= 450 * 1024) break;
    width = Math.max(2, Math.floor(width * 0.88 / 2) * 2);
    height = Math.max(2, Math.floor(height * 0.88 / 2) * 2);
  }
  if (body.length > 450 * 1024) throw new Error(`Optimized photo still exceeds 450 KB: ${input}`);
  return { body, sourceBytes: original.size };
}

async function upload(storagePath, body) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${storagePath}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/avif', 'x-upsert': 'true' }, body });
  if (!response.ok) throw new Error(`Image upload failed (${response.status}).`);
}

async function connectCoteCielCategory() {
  const existing = await request('products?brand=ilike.*ciel*&select=id,name,category_id,product_images(image_url,storage_path,position)');
  if (!existing.length) return { linkedProducts: 0 };
  const category = await ensureCategory({ name: 'Côte&Ciel', slug: 'cote-ciel', description: 'Sacs et accessoires Côte&Ciel : formes fonctionnelles, matières et lignes architecturales.', position: 6 });
  let linkedProducts = 0;
  for (const product of existing) {
    if (product.category_id && product.category_id !== category.id) continue;
    if (!product.category_id) await request(`products?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify({ category_id: category.id }) });
    linkedProducts += 1;
    if (!category.image_url) {
      const image = [...product.product_images].sort((a, b) => a.position - b.position)[0];
      if (image) {
        await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: image.image_url, storage_path: image.storage_path }) });
        category.image_url = image.image_url;
      }
    }
  }
  return { linkedProducts, categoryId: category.id };
}

async function main() {
  const plan = await planImport();
  const imageCount = plan.reduce((sum, product) => sum + product.files.length, 0);
  const variantCount = plan.reduce((sum, product) => sum + product.variants.length, 0);
  for (const item of plan) console.log(`[plan] ${item.brand} · ${item.name} · €${(item.priceCents / 100).toFixed(2)} · ${item.variants.length} sizes · ${item.files.length} photos`);
  console.log(`Validated ${plan.length} products, ${variantCount} variants, ${imageCount} images. No wholesale costs or spreadsheet stock figures will be applied.`);
  if (process.env.DRY_RUN === '1') return;
  await ensureServerKey();
  const temporary = await mkdtemp(path.join(tmpdir(), 'struktur-october-2026-'));
  const report = { importedAt: new Date().toISOString(), products: [], uploadedImages: 0, sourceBytes: 0, optimizedBytes: 0, maxImageBytes: 0, replacedDerivatives: [] };
  try {
    const byBrand = new Map();
    for (const item of plan) {
      let category = byBrand.get(item.brand);
      if (!category) { category = await ensureCategory(categories[item.brand]); byBrand.set(item.brand, category); }
      const existing = first(await request(`products?slug=eq.${encodeURIComponent(item.slug)}&select=id,status`));
      const product = existing || first(await request('products', { method: 'POST', body: JSON.stringify([{ category_id: category.id, name: item.name, slug: item.slug, brand: item.brand, description: item.description, price_cents: item.priceCents, currency: 'EUR', status: 'draft', featured: false }]) }));
      if (!product?.id) throw new Error(`Could not create ${item.slug}`);
      const currentVariants = await request(`product_variants?product_id=eq.${product.id}&select=sku`);
      const currentSkus = new Set(currentVariants.map((variant) => variant.sku));
      const newVariants = item.variants.filter((variant) => !currentSkus.has(variant.sku)).map((variant) => ({ ...variant, product_id: product.id, stock_quantity: 0 }));
      if (newVariants.length) await request('product_variants', { method: 'POST', body: JSON.stringify(newVariants) });
      const currentImages = await request(`product_images?product_id=eq.${product.id}&select=id,storage_path`);
      const currentPaths = new Set(currentImages.map((image) => image.storage_path));
      for (const [position, file] of item.files.entries()) {
        const input = path.join(item.folder, file);
        const info = imageInfo(input);
        const basePath = `${product.id}/october-2026-${String(position + 1).padStart(2, '0')}-${slugify(path.parse(file).name)}`;
        const storagePath = `${basePath}${hasAlpha(info) ? '-white' : ''}.avif`;
        if (currentPaths.has(storagePath)) continue;
        const legacy = hasAlpha(info) ? currentImages.find((image) => image.storage_path === `${basePath}.avif`) : null;
        const output = path.join(temporary, `${product.id}-${position}.avif`);
        const image = await optimizedImage(input, output, info);
        await upload(storagePath, image.body);
        const imageValues = { product_id: product.id, storage_path: storagePath, image_url: publicUrl(storagePath), alt_text: `${item.name} — vue produit ${position + 1}`, position };
        if (legacy) {
          await request(`product_images?id=eq.${legacy.id}`, { method: 'PATCH', body: JSON.stringify(imageValues) });
          report.replacedDerivatives.push(legacy.storage_path);
          if (category.storage_path === legacy.storage_path) {
            await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: publicUrl(storagePath), storage_path: storagePath }) });
            category.storage_path = storagePath;
            category.image_url = publicUrl(storagePath);
          }
        } else {
          await request('product_images?on_conflict=storage_path', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([imageValues]) });
        }
        report.uploadedImages += 1;
        report.sourceBytes += image.sourceBytes;
        report.optimizedBytes += image.body.length;
        report.maxImageBytes = Math.max(report.maxImageBytes, image.body.length);
        if (!category.image_url) {
          await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: publicUrl(storagePath), storage_path: storagePath }) });
          category.image_url = publicUrl(storagePath);
        }
      }
      if (!existing) await request(`products?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
      report.products.push({ id: product.id, slug: item.slug, brand: item.brand, expectedImages: item.files.length, expectedVariants: item.variants.length, created: !existing });
      console.log(`Synchronized ${item.brand} · ${item.name}: ${item.files.length} AVIF images, ${item.variants.length} sizes.`);
    }
    report.coteCiel = await connectCoteCielCategory();
    const ids = report.products.map((product) => product.id).join(',');
    const live = await request(`products?id=in.(${ids})&select=id,status,product_images(storage_path),product_variants(stock_quantity)`);
    for (const item of report.products) {
      const product = live.find((row) => row.id === item.id);
      if (!product || product.product_images.length < item.expectedImages || product.product_variants.length < item.expectedVariants) throw new Error(`Incomplete live product ${item.slug}`);
      if (item.created && (product.status !== 'active' || product.product_variants.some((variant) => variant.stock_quantity !== 0))) throw new Error(`Unexpected new product status or inventory: ${item.slug}`);
    }
    report.verified = { products: live.length, active: live.filter((item) => item.status === 'active').length, images: live.reduce((sum, item) => sum + item.product_images.length, 0), variants: live.reduce((sum, item) => sum + item.product_variants.length, 0) };
    if (report.replacedDerivatives.length) {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const response = await fetch(`${supabaseUrl}/storage/v1/object/product-images`, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: report.replacedDerivatives }) });
      if (!response.ok) throw new Error(`Could not remove replaced image derivatives (${response.status}).`);
    }
    await mkdir('.seo', { recursive: true });
    await writeFile('.seo/october-2026-import-report.json', `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ verified: report.verified, coteCiel: report.coteCiel, uploadedImages: report.uploadedImages, replacedDerivatives: report.replacedDerivatives.length, maxImageKB: Math.ceil(report.maxImageBytes / 1024), sourceMB: +(report.sourceBytes / 1024 / 1024).toFixed(2), optimizedMB: +(report.optimizedBytes / 1024 / 1024).toFixed(2) }));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
