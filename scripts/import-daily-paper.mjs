import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || 'https://nvvlndtgcmwmxgtlhaxj.supabase.co';
const root = path.resolve('Daily Paper');
const brand = 'Daily Paper';
const category = {
  name: 'Daily Paper',
  slug: 'daily-paper',
  description: 'La sélection Daily Paper : pièces contemporaines, graphismes signature et silhouettes streetwear.',
  position: 8,
};
const imageExtensions = /\.(avif|jpe?g|png|webp)$/i;

// One source folder is a byte-for-byte duplicate of the first Ayan jacket folder.
// Keep that product once, using the folder whose name matches the official listing.
const duplicateFolders = ['Ayan Monogram Puffer Jacket'];
const products = [
  {
    folder: 'Army Green Ayan Monogram Puffer Jacket',
    name: 'Army Green Ayan Monogram Puffer Jacket',
    slug: 'army-green-ayan-monogram-puffer-jacket',
    priceCents: 33995,
    description: 'Doudoune à coupe boxy avec imprimé monogramme intégral scellé, col bomber, zip dissimulé et bas élastiqué avec bloque-cordon ; elle possède une poche latérale.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Army Green Leather Collar Monogram Workwear Jacket',
    name: 'Army Green Leather Collar Monogram Workwear Jacket',
    slug: 'army-green-fur-collar-monogram-workwear-jacket',
    priceCents: 24995,
    description: 'Veste workwear à coupe décontractée en denim non extensible, avec col en cuir, monogramme intégral imprimé au laser, plis aux manches, zip dissimulé et poches.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Army Green Wide Leg Pants',
    name: 'Army Green Wide Leg Pants',
    slug: 'army-green-wide-leg-pants',
    priceCents: 12995,
    description: 'Pantalon oversize à jambes larges en French Terry de coton doux, avec taille à cordon, poches avant inclinées, poche arrière et logo Dias brodé.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Beige Faded Monogram Amba Jeans',
    name: 'Beige Faded Monogram Amba Jeans',
    slug: 'beige-faded-monogram-amba-jeans',
    priceCents: 13995,
    description: 'Jean à coupe droite en denim non extensible, avec monogramme intégral imprimé au laser et effet spray délavé, fermeture zip-bouton, poches avant arrondies et poches plaquées arrière.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Black Burned Shield Fur Jacket',
    name: 'Black Burned Shield Fur Jacket',
    slug: 'black-burned-shield-fur-jacket',
    priceCents: 19995,
    description: 'Veste à coupe décontractée en sherpa doux, ornée d’un imprimé intégral « Burned Shield », avec boutons-pression siglés et poches plaquées.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Black Dias Taye Track Jacket',
    name: 'Black Dias Taye Track Jacket',
    slug: 'black-dias-taye-track-jacket',
    priceCents: 15995,
    description: 'Veste de survêtement légère en nylon à coupe décontractée, avec passepoil réfléchissant devant et dos, logo Dias imprimé sur la poitrine, col montant et bas élastiqué à cordon.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    excludeImages: ['TRACK_PANTS'],
  },
  {
    folder: 'Black Raglan Sleeve Dias Puffer Jacket',
    name: 'Black Raglan Sleeve Dias Puffer Jacket',
    slug: 'black-raglan-sleeve-dias-puffer-jacket',
    priceCents: 29995,
    description: 'Doudoune à coupe décontractée en tissu ripstop, avec manches raglan, logo Dias en impression caoutchouc haute densité sur la poitrine et capuche à cordon.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Black Shield Knit Zip U',
    name: 'Black Shield Knit Zip Up',
    slug: 'black-shield-knit-zip-up',
    priceCents: 17995,
    description: 'Pull zippé en maille de fil polyester doux mélangé à un fil poilu, avec motif intégral de contour Shield, col montant côtelé et zip double sens.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Boxy Army Green Zip Up Hoodie',
    name: 'Boxy Army Green Zip Up Hoodie',
    slug: 'army-green-boxy-zip-up-hoodie',
    priceCents: 16995,
    description: 'Sweat à capuche boxy en French Terry de coton doux, avec fermeture intégrale, cordons en coton, logo Dias brodé et poches kangourou.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Boxy Burgundy Washed Check Flannel Shirt',
    name: 'Boxy Burgundy Washed Check Flannel Shirt',
    slug: 'burgundy-washed-check-ls-shirt',
    priceCents: 15995,
    description: 'Chemise à coupe boxy en tissu à carreaux teint-fil chenille, douce et texturée, avec logo Dias brodé sur la poitrine et le dos, poches poitrine et boutons siglés.',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    folder: 'Dias Taye Track Pants',
    name: 'Black Dias Taye Track Pants',
    slug: 'black-dias-taye-track-pants',
    priceCents: 11995,
    description: 'Pantalon de survêtement léger en nylon assorti à la veste Taye, avec passepoil réfléchissant, logo Dias imprimé, taille à cordon et poches avant inclinées.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Hawaiian Sunset Dias Washed Hoodie',
    name: 'Hawaiian Sunset Dias Washed Hoodie',
    slug: 'hawaiian-sunset-dias-washed-hoodie',
    priceCents: 13995,
    description: 'Sweat à capuche en molleton de coton brossé doux, à aspect délavé, avec logo « Dias » imprimé sur la poitrine.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Hawaiian Sunset Origami Shield Sweater',
    name: 'Hawaiian Sunset Origami Shield Sweater',
    slug: 'hawaiian-sunset-origami-shield-sweater',
    priceCents: 11995,
    description: 'Sweat col rond en molleton de coton brossé doux, avec impression « Origami » des logos Dias et Shield sur la poitrine et grand motif assorti au dos.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Hawaiian Sunset Origami Shield T-Shirt',
    name: 'Hawaiian Sunset Origami Shield T-Shirt',
    slug: 'hawaiian-sunset-origami-shield-t-shirt',
    priceCents: 6495,
    description: 'T-shirt en jersey simple de coton doux, avec impression « Origami » des logos Dias et Shield sur la poitrine et grand motif assorti au dos.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Hawaiian Sunset Raglan Sleeve Dias Puffer Jacket',
    name: 'Hawaiian Sunset Raglan Sleeve Dias Puffer Jacket',
    slug: 'hawaiian-sunset-raglan-sleeve-dias-puffer-jacket',
    priceCents: 29995,
    description: 'Doudoune à coupe décontractée en tissu ripstop, avec manches raglan, logo Dias en impression caoutchouc haute densité sur la poitrine et capuche à cordon.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Oversized Army Green Self Fabric Orbit Hoodie',
    name: 'Oversized Army Green Self Fabric Orbit Hoodie',
    slug: 'army-green-self-fabric-oversized-orbit-hoodie',
    priceCents: 13995,
    description: 'Sweat à capuche oversize en French Terry de coton doux, avec motif « Orbit » à bords bruts réalisé dans le même tissu sur le devant et poche kangourou.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Oversized Red Clay Orbit Knit Hoodie',
    name: 'Oversized Red Clay Orbit Knit Hoodie',
    slug: 'red-clay-orbit-knit-oversized-hoodie',
    priceCents: 15995,
    description: 'Sweat à capuche oversize tricoté dans un fil polyester doux mélangé à un fil poilu, avec motif « Orbit » en maille torsadée au dos, badge DP brodé et poche kangourou.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Raglan Stacked Dias Washed Jersey T Shirt',
    name: 'Boxy Washed Black Raglan Stacked Dias Jersey T-Shirt',
    slug: 'washed-black-raglan-stacked-dias-washed-jersey-t-shirt',
    priceCents: 7995,
    description: 'T-shirt boxy à manches raglan et coutures latérales découpées, en French Terry doux lavé en pièce, avec détails usés, écussons « Dias Arch » cousus et coupe légèrement raccourcie.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Washed Black Textured Metallic Shield Sweater',
    name: 'Washed Black Textured Metallic Shield Sweater',
    slug: 'washed-black-textured-metallic-shield-sweater',
    priceCents: 11995,
    description: 'Sweat col rond en molleton de coton brossé doux avec finition délavée acide, impression métallique texturée des logos Dias et Shield sur la poitrine et grand motif assorti au dos.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'Washed Black Textured Metallic Shield T-Shirt',
    name: 'Washed Black Textured Metallic Shield T-Shirt',
    slug: 'washed-black-textured-metallic-shield-t-shirt',
    priceCents: 6495,
    description: 'T-shirt en jersey simple de coton doux avec finition délavée acide, impression métallique texturée des logos Dias et Shield sur la poitrine et grand motif assorti au dos.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    folder: 'White Origami Shield T-Shirt',
    name: 'White Origami Shield T-Shirt',
    slug: 'white-origami-shield-t-shirt',
    priceCents: 6495,
    description: 'T-shirt en jersey simple de coton doux, avec impression « Origami » des logos Dias et Shield sur la poitrine et grand motif assorti au dos.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
];

const first = (value) => Array.isArray(value) ? value[0] : value;
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const publicUrl = (bucket, storagePath) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
const request = async (endpoint, options = {}) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`${endpoint} ${response.status}: ${body}`);
  return body ? JSON.parse(body) : [];
};

const ensureServiceKey = async () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY before importing.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Could not read Supabase project API keys (${response.status}).`);
  const keys = await response.json();
  const serviceKey = keys.find((key) => key.id === 'service_role')?.api_key || keys.find((key) => key.type === 'secret')?.api_key;
  if (!serviceKey) throw new Error('No server-side Supabase key is available for this project.');
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
};

const resolveFolder = async (parent, name) => {
  const entries = await readdir(parent, { withFileTypes: true });
  const found = entries.find((entry) => entry.isDirectory() && slugify(entry.name) === slugify(name));
  if (!found) throw new Error(`Missing Daily Paper folder: ${path.join(parent, name)}`);
  return path.join(parent, found.name);
};

const imagePriority = (filename) => {
  const name = filename.toLowerCase();
  if (/(?:^|[_ -])front(?:[_ .-]|$)/.test(name)) return 0;
  if (/\b(?:top|fullbody).*high.?res\b/.test(name)) return 1;
  if (/(?:^|[_ -])back|rear(?:[_ .-]|$)/.test(name)) return 2;
  if (/(?:^|[_ -])detail(?:[_ .-]|$)/.test(name)) return 3;
  return 1;
};

const getImages = async (folder, exclude = []) => (await readdir(folder))
  .filter((filename) => imageExtensions.test(filename))
  .filter((filename) => !exclude.some((term) => filename.toUpperCase().includes(term)))
  .sort((a, b) => imagePriority(a) - imagePriority(b) || a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

const convertToAvif = (source, destination) => {
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
    '-vf', "scale='if(gt(iw,ih),min(1800,iw),-2)':'if(gt(ih,iw),min(1800,ih),-2)'",
    '-c:v', 'libsvtav1', '-crf', '35', '-preset', '8', '-frames:v', '1', '-map_metadata', '-1', destination,
  ], { stdio: 'ignore' });
  return readFile(destination);
};

const uploadImage = async (storagePath, body) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${storagePath}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/avif', 'x-upsert': 'true' },
    body,
  });
  if (!response.ok) throw new Error(`Image upload failed (${response.status}): ${await response.text()}`);
};

const ensureCategory = async () => {
  const rows = await request(`categories?slug=eq.${encodeURIComponent(category.slug)}&select=id,image_url,storage_path`);
  let result = first(rows);
  if (!result) result = first(await request('categories?on_conflict=slug', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([category]),
  }));
  if (!result?.id) throw new Error('Could not create Daily Paper category.');
  await request(`categories?id=eq.${result.id}`, {
    method: 'PATCH', body: JSON.stringify({ name: category.name, description: category.description, position: category.position }),
  });
  return result;
};

const main = async () => {
  const rootEntries = await readdir(root, { withFileTypes: true });
  const sourceFolders = rootEntries.filter((entry) => entry.isDirectory());
  const expectedFolders = new Set([...products.map((product) => slugify(product.folder)), ...duplicateFolders.map(slugify)]);
  const unexpected = sourceFolders.filter((entry) => !expectedFolders.has(slugify(entry.name)));
  if (unexpected.length) throw new Error(`Unmapped source folders: ${unexpected.map((entry) => entry.name).join(', ')}`);
  for (const product of products) {
    if (!sourceFolders.some((entry) => slugify(entry.name) === slugify(product.folder))) {
      throw new Error(`Missing product folder: ${product.folder}`);
    }
  }

  const plan = [];
  for (const product of products) {
    const folder = await resolveFolder(root, product.folder);
    const images = await getImages(folder, product.excludeImages);
    if (!images.length) throw new Error(`No product images found for ${product.name}.`);
    const variants = product.sizes.map((size, position) => ({
      name: size,
      sku: `DP-${product.slug.toUpperCase()}-${size}`,
      priceCents: product.priceCents,
      attributes: { size },
      position,
    }));
    plan.push({ ...product, folder, images, variants });
  }

  if (plan.length !== 21 || sourceFolders.length !== 22) {
    throw new Error(`Expected 21 unique products plus one duplicate folder; found ${plan.length} product mappings and ${sourceFolders.length} folders.`);
  }
  const imageCount = plan.reduce((sum, product) => sum + product.images.length, 0);
  const variantCount = plan.reduce((sum, product) => sum + product.variants.length, 0);
  for (const product of plan) {
    console.log(`[${process.env.DRY_RUN === '1' ? 'dry-run' : 'plan'}] ${product.name} · €${(product.priceCents / 100).toFixed(2)} · ${product.variants.length} tailles · ${product.images.length} images`);
  }
  console.log(`Validated ${plan.length} unique products, ${variantCount} size variants, and ${imageCount} images. Ignored duplicate folder: ${duplicateFolders[0]}.`);
  if (process.env.DRY_RUN === '1') return;

  await ensureServiceKey();
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'struktur-daily-paper-'));
  try {
    const categoryRow = await ensureCategory();
    for (const productInput of plan) {
      const payload = {
        category_id: categoryRow.id,
        name: productInput.name,
        slug: productInput.slug,
        brand,
        description: productInput.description,
        price_cents: productInput.priceCents,
        currency: 'EUR',
        status: 'active',
        featured: false,
      };
      let product = first(await request(`products?slug=eq.${encodeURIComponent(productInput.slug)}&select=id`));
      if (!product) product = first(await request('products?on_conflict=slug', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify([payload]),
      }));
      if (!product?.id) throw new Error(`Could not create ${productInput.name}.`);
      await request(`products?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify(payload) });

      const currentVariants = await request(`product_variants?product_id=eq.${product.id}&select=id,sku`);
      const variantBySku = new Map(currentVariants.map((variant) => [variant.sku, variant.id]));
      for (const [position, variant] of productInput.variants.entries()) {
        const values = {
          name: variant.name,
          price_cents: variant.priceCents,
          attributes: variant.attributes,
          position,
        };
        const existingVariantId = variantBySku.get(variant.sku);
        if (existingVariantId) {
          await request(`product_variants?id=eq.${existingVariantId}`, { method: 'PATCH', body: JSON.stringify(values) });
        } else {
          await request('product_variants', {
            method: 'POST',
            body: JSON.stringify([{ ...values, sku: variant.sku, product_id: product.id, stock_quantity: 0 }]),
          });
        }
      }

      const existingImages = await request(`product_images?product_id=eq.${product.id}&select=id,storage_path`);
      const currentPaths = new Set(existingImages.map((image) => image.storage_path).filter(Boolean));
      for (const [position, filename] of productInput.images.entries()) {
        const sourceSlug = slugify(path.basename(filename, path.extname(filename)));
        const storagePath = `${product.id}/daily-paper-${String(position + 1).padStart(3, '0')}-${sourceSlug}.avif`;
        const existingImage = existingImages.find((image) => image.storage_path === storagePath);
        if (existingImage) {
          await request(`product_images?id=eq.${existingImage.id}`, {
            method: 'PATCH', body: JSON.stringify({ position, alt_text: `${productInput.name} — vue produit ${position + 1}` }),
          });
          continue;
        }
        if (currentPaths.has(storagePath)) continue;
        const convertedPath = path.join(tempDirectory, `${product.id}-${String(position + 1).padStart(3, '0')}.avif`);
        const imageBuffer = await convertToAvif(path.join(productInput.folder, filename), convertedPath);
        await uploadImage(storagePath, imageBuffer);
        await request('product_images?on_conflict=storage_path', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify([{
            product_id: product.id,
            storage_path: storagePath,
            image_url: publicUrl('product-images', storagePath),
            alt_text: `${productInput.name} — vue produit ${position + 1}`,
            position,
          }]),
        });
        currentPaths.add(storagePath);
        if (!categoryRow.image_url) {
          categoryRow.image_url = publicUrl('product-images', storagePath);
          await request(`categories?id=eq.${categoryRow.id}`, {
            method: 'PATCH', body: JSON.stringify({ image_url: categoryRow.image_url, storage_path: storagePath }),
          });
        }
      }
      console.log(`Synchronized ${productInput.name}: ${productInput.variants.length} sizes, ${productInput.images.length} optimized images.`);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }

  console.log(`Daily Paper catalog sync complete: ${plan.length} products, ${imageCount} source images optimized as AVIF, ${variantCount} size variants.`);
  console.log('New size variants have stock 0. Enter actual shop inventory in Admin before making them purchasable. Existing variant stock is preserved.');
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
