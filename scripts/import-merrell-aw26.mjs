import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || 'https://nvvlndtgcmwmxgtlhaxj.supabase.co';
const imageExtensions = /\.(avif|jpe?g|png|webp)$/i;
const sizes = ['S', 'M', 'L', 'XL', '2XL'];
const apparelSizes = (code) => sizes.map((size) => ({ name: size, sku: `${code}-${size}` }));
const euSizes = (code, start, end) => Array.from({ length: end - start + 1 }, (_, index) => {
  const size = String(start + index);
  return { name: size, sku: `${code}-EU${size}` };
});

const groups = [
  {
    root: path.resolve('Merrell'),
    category: { name: 'Merrell', slug: 'merrell', description: 'Chaussures Merrell pour la randonnée, le trail et le quotidien.', position: 3 },
    brand: 'Merrell',
    products: [
      {
        folders: ['Ontario Speed Leather Lace', 'hazel'], code: 'J2007611', name: 'Ontario Speed Leather Lace — Hazel', color: 'Hazel', priceCents: 16500, sizes: euSizes('J2007611', 36, 47),
        description: 'La Ontario Speed Leather Lace associe une silhouette de randonnée classique à la légèreté et au dynamisme de la gamme Moab Speed. Sa tige en cuir pleine fleur, sa plaque de protection, sa semelle intermédiaire Super Rebound Compound et sa semelle extérieure Vibram TC5+ sont conçues pour accompagner les sorties sur sentier comme les journées en ville.',
      },
      {
        folders: ['Ontario Speed Leather Lace', 'lost lilac'], code: 'J00003635', name: 'Ontario Speed Leather Lace — Lost Lilac', color: 'Lost Lilac', priceCents: 16500, sizes: euSizes('J00003635', 36, 47),
        description: 'La Ontario Speed Leather Lace associe une silhouette de randonnée classique à la légèreté et au dynamisme de la gamme Moab Speed. Sa tige en cuir pleine fleur, sa plaque de protection, sa semelle intermédiaire Super Rebound Compound et sa semelle extérieure Vibram TC5+ sont conçues pour accompagner les sorties sur sentier comme les journées en ville.',
      },
      {
        folders: ['MOAB SPEED 2 VENT 2K CIRRUS'], code: 'J00005421', name: 'Moab Speed 2 Vent 2K SE — Cirrus', color: 'Cirrus', priceCents: 13000, sizes: euSizes('J00005421', 36, 42),
        description: 'La Moab Speed 2 Vent 2K SE est une chaussure de randonnée basse et respirante. Sa tige en mesh, matière synthétique et TPU est complétée par des renforts au talon et à l’avant-pied, une plaque de protection, une semelle intermédiaire FloatPro et une semelle extérieure Vibram TC5+.',
      },
      {
        folders: ['MOAB SPEED 2 VENT 2K SEDIORITE'], code: 'J00005422', name: 'Moab Speed 2 Vent 2K SE — Diorite', color: 'Diorite', priceCents: 13000, sizes: euSizes('J00005422', 36, 42),
        description: 'La Moab Speed 2 Vent 2K SE est une chaussure de randonnée basse et respirante. Sa tige en mesh, matière synthétique et TPU est complétée par des renforts au talon et à l’avant-pied, une plaque de protection, une semelle intermédiaire FloatPro et une semelle extérieure Vibram TC5+.',
      },
      {
        folders: ['Homme Moab Speed 2 Vent 2K', 'Talus'], code: 'J00005339', name: 'Moab Speed 2 Vent 2K — Talus', color: 'Talus', priceCents: 13000, sizes: euSizes('J00005339', 40, 50),
        description: 'La Moab Speed 2 Vent 2K pour homme est une chaussure de randonnée basse et respirante. Elle associe une tige en mesh et matière synthétique, des renforts protecteurs, une plaque de protection, une semelle intermédiaire FloatPro et une semelle extérieure Vibram TC5+.',
      },
    ],
  },
  {
    root: path.resolve('AW26 Struktur'),
    category: { name: 'The GoodPeople', slug: 'the-goodpeople', description: 'Vêtements homme The GoodPeople : pièces contemporaines, imprimés graphiques et essentiels de saison.', position: 4 },
    brand: 'The GoodPeople',
    products: [
      {
        folders: ['Tex - White'], code: '26020903-1000', name: 'Tex T-Shirt — White', color: 'White', priceCents: 7500, sizes: apparelSizes('26020903-1000'),
        description: 'T-shirt homme blanc en 100 % coton, avec une face avant épurée et un grand motif floral dessiné au dos. Le modèle Tex apporte une touche graphique à une silhouette facile à porter au quotidien.',
      },
      {
        folders: ['Lito - Navy'], code: '26020700-7800', name: 'Lito Sweatshirt — Navy', color: 'Navy', priceCents: 14000, sizes: apparelSizes('26020700-7800'),
        description: 'Sweatshirt homme Lito en bleu marine, rehaussé d’un visuel graphique blanc et du logo The GoodPeople. Une pièce décontractée à associer avec un jean ou un pantalon de la collection.',
      },
      {
        // The supplied folder says “Luke”; article code 26020708 identifies the official Look sweatshirt.
        folders: ['Luke - Chocolate Brown'], code: '26020708-3400', name: 'Look Sweatshirt — Chocolate Brown', color: 'Chocolate Brown', priceCents: 13000, sizes: apparelSizes('26020708-3400'),
        description: 'Sweatshirt homme Look dans le coloris Chocolate Brown. Sa silhouette à col rond et son marquage The GoodPeople en font une pièce facile à intégrer aux tenues de saison.',
      },
      {
        folders: ['Tphoto - White'], code: '26020911-1000', name: 'Tphoto T-Shirt — White', color: 'White', priceCents: 7999, sizes: apparelSizes('26020911-1000'),
        description: 'T-shirt homme blanc en coton, à la coupe regular. Le modèle Tphoto associe un logo discret sur le devant à un visuel imprimé au dos.',
      },
      {
        folders: ['Stanford - Forest Green'], code: '26020212-8006', name: 'Stanford Denim Shirt — Forest Green', color: 'Forest Green', priceCents: 16500, sizes: apparelSizes('26020212-8006'),
        description: 'Chemise Stanford en denim de coton, dans un coloris Forest Green. Sa coupe décontractée revisite une silhouette classique. Composition : 80 % coton et 20 % coton recyclé. Conçue à Rotterdam et fabriquée au Portugal.',
      },
      {
        folders: ['Sergio - Brown'], code: '26020225-3200', name: 'Sergio Check Overshirt — Brown Check', color: 'Brown Check', priceCents: 23999, sizes: apparelSizes('26020225-3200'),
        description: 'Surchemise Sergio à motif à carreaux brun, avec fermeture boutonnée et deux poches poitrine. Sa matière au toucher brossé et sa construction en font une couche intermédiaire à porter seule ou sur un tee-shirt.',
      },
      {
        folders: ['Lax - Off White'], code: '26020710-1100', name: 'Lax Sweatshirt — Off White', color: 'Off White', priceCents: 14000, sizes: apparelSizes('26020710-1100'),
        description: 'Sweatshirt homme Lax en coloris Off White, signé The GoodPeople. Une pièce à col rond qui complète une tenue décontractée de saison.',
      },
      {
        folders: ['Took - Chocolate Brown'], code: '26020908-3400', name: 'Took T-Shirt — Chocolate Brown', color: 'Chocolate Brown', priceCents: 8500, sizes: apparelSizes('26020908-3400'),
        description: 'T-shirt homme Took en coloris Chocolate Brown, avec une coupe regular et un imprimé graphique au dos. Une pièce facile à porter au quotidien.',
      },
      {
        folders: ['Bob - Denim Forest Green'], code: '26020502-8006', name: 'Bob Denim Trousers — Forest Green', color: 'Forest Green', priceCents: 17500, sizes: ['29', '30', '31', '32', '33', '34', '36', '38'].map((size) => ({ name: size, sku: `26020502-8006-W${size}` })),
        description: 'Pantalon Bob Denim de The GoodPeople en coloris Forest Green. Le modèle est référencé par la marque comme un pantalon en denim ; les photos du produit montrent sa teinte et ses détails.',
      },
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

const storageUpload = async (storagePath, body) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${storagePath}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/avif', 'x-upsert': 'true' },
    body,
  });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status}): ${await response.text()}`);
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

const resolveDirectory = async (root, folders) => {
  let directory = root;
  for (const folder of folders) {
    const entries = await readdir(directory, { withFileTypes: true });
    const match = entries.find((entry) => entry.isDirectory() && slugify(entry.name) === slugify(folder));
    if (!match) throw new Error(`Folder not found: ${path.join(directory, folder)}`);
    directory = path.join(directory, match.name);
  }
  return directory;
};

const sourceImages = async (directory, useHighResolutionOnly) => {
  const files = (await readdir(directory)).filter((file) => imageExtensions.test(file)).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }));
  if (!useHighResolutionOnly) return files;
  const highResolution = [];
  for (const file of files) {
    const imagePath = path.join(directory, file);
    const dimensions = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', imagePath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const width = Number(dimensions.match(/pixelWidth: (\d+)/)?.[1]);
    const height = Number(dimensions.match(/pixelHeight: (\d+)/)?.[1]);
    if (Math.max(width, height) >= 2000) highResolution.push(file);
  }
  return highResolution.length ? highResolution : files;
};

const convertToAvif = async (source, output) => {
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
    '-vf', "scale='if(gt(iw,ih),min(1800,iw),-2)':'if(gt(ih,iw),min(1800,ih),-2)'",
    '-c:v', 'libsvtav1', '-crf', '32', '-preset', '8', '-frames:v', '1', '-map_metadata', '-1', output,
  ], { stdio: 'ignore' });
  return readFile(output);
};

const ensureCategory = async (input) => {
  const rows = await request(`categories?slug=eq.${encodeURIComponent(input.slug)}&select=id,image_url,storage_path`);
  const category = first(rows) || first(await request('categories?on_conflict=slug', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([input]),
  }));
  if (!category?.id) throw new Error(`Could not create category ${input.name}.`);
  await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ name: input.name, description: input.description, position: input.position }) });
  return category;
};

const main = async () => {
  const plan = [];
  const slugs = new Set();
  let imageCount = 0;
  for (const group of groups) {
    for (const source of group.products) {
      const directory = await resolveDirectory(group.root, source.folders);
      const images = await sourceImages(directory, group.category.slug === 'the-goodpeople');
      if (!images.length) throw new Error(`No images found in ${directory}.`);
      const slug = slugify(source.name);
      if (slugs.has(slug)) throw new Error(`Duplicate product slug: ${slug}`);
      slugs.add(slug);
      imageCount += images.length;
      plan.push({ group, source, directory, images, slug });
      console.log(`[${process.env.DRY_RUN === '1' ? 'dry-run' : 'plan'}] ${group.category.name} · ${source.name} · €${(source.priceCents / 100).toFixed(2)} · ${source.sizes.length} sizes · ${images.length} optimized-source images`);
    }
  }
  if (plan.length !== 14) throw new Error(`Expected 14 products but mapped ${plan.length}.`);
  console.log(`${plan.length} products and ${imageCount} source photos validated. Sizes exist with stock 0 until real quantities are added.`);
  if (process.env.DRY_RUN === '1') return;

  await ensureServiceKey();
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'struktur-new-catalog-'));
  let uploadedCount = 0;
  try {
    const categories = new Map();
    for (const item of plan) {
      if (!categories.has(item.group.category.slug)) categories.set(item.group.category.slug, await ensureCategory(item.group.category));
      const category = categories.get(item.group.category.slug);
      const { source, group, images, directory, slug } = item;
      const payload = {
        category_id: category.id,
        name: source.name,
        slug,
        brand: group.brand,
        description: source.description,
        price_cents: source.priceCents,
        currency: 'EUR',
        status: 'active',
        featured: false,
      };
      const existing = first(await request(`products?slug=eq.${encodeURIComponent(slug)}&select=id`));
      const product = existing || first(await request('products?on_conflict=slug', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify([payload]),
      }));
      if (!product?.id) throw new Error(`Could not create ${source.name}.`);
      await request(`products?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify(payload) });

      const existingVariants = await request(`product_variants?product_id=eq.${product.id}&select=sku`);
      const existingSkus = new Set(existingVariants.map((variant) => variant.sku));
      const newVariants = source.sizes.filter((variant) => !existingSkus.has(variant.sku)).map((variant, position) => ({
        product_id: product.id,
        name: variant.name,
        sku: variant.sku,
        price_cents: source.priceCents,
        stock_quantity: 0,
        position,
      }));
      if (newVariants.length) await request('product_variants', { method: 'POST', body: JSON.stringify(newVariants) });

      const existingImages = await request(`product_images?product_id=eq.${product.id}&select=id,storage_path`);
      const existingPaths = new Map(existingImages.map((image) => [image.storage_path, image.id]));
      for (const [position, filename] of images.entries()) {
        const sourceKey = slugify(path.basename(filename, path.extname(filename)));
        const storagePath = `${product.id}/new-catalog-${String(position + 1).padStart(3, '0')}-${sourceKey}.avif`;
        const altText = `${source.name} chez STRUKTUR Grenoble`;
        if (existingPaths.has(storagePath)) {
          await request(`product_images?id=eq.${existingPaths.get(storagePath)}`, { method: 'PATCH', body: JSON.stringify({ alt_text: altText, position }) });
          continue;
        }
        const convertedPath = path.join(tempDirectory, `${product.id}-${String(position + 1).padStart(3, '0')}.avif`);
        const image = await convertToAvif(path.join(directory, filename), convertedPath);
        await storageUpload(storagePath, image);
        await request('product_images?on_conflict=storage_path', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify([{
            product_id: product.id,
            storage_path: storagePath,
            image_url: publicUrl('product-images', storagePath),
            alt_text: altText,
            position,
          }]),
        });
        uploadedCount += 1;
        if (!category.image_url) {
          const imageUrl = publicUrl('product-images', storagePath);
          await request(`categories?id=eq.${category.id}`, { method: 'PATCH', body: JSON.stringify({ image_url: imageUrl, storage_path: storagePath }) });
          category.image_url = imageUrl;
        }
      }
      console.log(`Imported ${source.name}; ${images.length} image(s), ${newVariants.length} new size variant(s).`);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
  console.log(`Done. ${plan.length} products mapped; ${uploadedCount} optimized AVIF images uploaded. All variant stock remains 0.`);
};

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
