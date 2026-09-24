const projectRef = process.env.SUPABASE_PROJECT_REF || 'nvvlndtgcmwmxgtlhaxj';
const supabaseUrl = process.env.SUPABASE_URL || `https://${projectRef}.supabase.co`;
const groups = [
  {
    name: 'Shadow 5000', slug: 'shadow-5000', priceCents: 14000,
    description: 'La Saucony Shadow 5000 reprend une silhouette de running des années 1980, pensée aujourd’hui pour un usage quotidien. Sa construction associe mesh et empiècements en suède, avec amorti EVA et semelle extérieure XT-600.',
    colorways: [
      ['shadow-5000-ivory-pine', 'S101517-1010', 'Ivory / Pine'], ['shadow-5000-martini-coca', 'S101517-1061', 'Martini / Coca'],
      ['shadow-5000-naval-pine', 'S101517-1062', 'Naval / Pine'], ['shadow-5000-grey-grey', 'S70665-23', 'Grey / Grey'], ['shadow-5000-navy-grey', 'S70665-24', 'Navy / Grey'],
    ],
  },
  {
    name: 'ProGrid Guide 7', slug: 'progrid-guide-7', priceCents: 14000,
    description: 'La Saucony ProGrid Guide 7 revisite une chaussure de running de l’ère Y2K dans une silhouette rétro à porter au quotidien. Sa tige en mesh, ses détails réfléchissants et la technologie d’amorti PowerGrid reprennent les éléments caractéristiques du modèle.',
    colorways: [
      ['progrid-guide-7-trek-sage', 'S101493-1007', 'Trek / Sage'], ['progrid-guide-7-cadet-rooibos', 'S101493-1051', 'Cadet / Rooibos'],
      ['progrid-guide-7-silver-maroon', 'S101493-1013', 'Silver / Maroon'], ['progrid-guide-7-white-drupe', 'S101493-1049', 'White / Drupe'],
    ],
  },
  {
    name: 'ProGrid Omni 9', slug: 'progrid-omni-9', priceCents: 16000,
    description: 'La Saucony ProGrid Omni 9 reprend une silhouette technique de running du début des années 2000. Sa tige combine mesh respirant et empiècements de renfort, avec une cage au médio-pied et l’amorti GRID.',
    colorways: [
      ['progrid-omni-9-mint-multi', 'SAU-PROGRID-OMNI-9-MINT-MULTI', 'Mint / Multi'], ['progrid-omni-9-aureate-white', 'SAU-PROGRID-OMNI-9-AUREATE-WHITE', 'Aureate / White'],
      ['progrid-omni-9-gadget-pine', 'SAU-PROGRID-OMNI-9-GADGET-PINE', 'Gadget / Pine'], ['progrid-omni-9-black-silver', 'SAU-PROGRID-OMNI-9-BLACK-SILVER', 'Black / Silver'],
      ['progrid-omni-9-cadet-vizired', 'SAU-PROGRID-OMNI-9-CADET-VIZIRED', 'Cadet / ViZiRed'], ['progrid-omni-9-saddle-eggshell', 'SAU-PROGRID-OMNI-9-SADDLE-EGGSHELL', 'Saddle / Eggshell'],
      ['progrid-omni-9-sage-black', 'SAU-PROGRID-OMNI-9-SAGE-BLACK', 'Sage / Black'], ['progrid-omni-9-eggshell-quartz', 'SAU-PROGRID-OMNI-9-EGGSHELL-QUARTZ', 'Eggshell / Quartz'],
    ],
  },
];

const first = (value) => Array.isArray(value) ? value[0] : value;
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
  if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY.');
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Could not read project keys (${response.status}).`);
  const keys = await response.json();
  const key = keys.find((item) => item.id === 'service_role')?.api_key || keys.find((item) => item.type === 'secret')?.api_key;
  if (!key) throw new Error('No server-side Supabase key available.');
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
};

const main = async () => {
  await ensureServiceKey();
  const categories = await request('categories?slug=eq.saucony&select=id,name');
  const category = first(categories);
  if (!category) throw new Error('Saucony category missing.');
  const products = await request(`products?category_id=eq.${category.id}&select=id,name,slug,price_cents`);
  const expectedSlugs = new Set(groups.flatMap((group) => group.colorways.map(([slug]) => slug)));
  if (products.length !== expectedSlugs.size || products.some((product) => !expectedSlugs.has(product.slug))) {
    throw new Error(`Safety check failed: expected exactly ${expectedSlugs.size} imported Saucony colorway products; found ${products.length}. No changes made.`);
  }
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  for (const group of groups) {
    const existing = await request(`products?slug=eq.${group.slug}&select=id`);
    if (existing.length && !products.some((product) => product.id === existing[0].id)) throw new Error(`Target slug already exists: ${group.slug}. No changes made.`);
  }

  const work = [];
  for (const group of groups) {
    const anchor = productsBySlug.get(group.colorways[0][0]);
    const variants = [];
    const images = [];
    const oldIds = [];
    for (const [colorPosition, [sourceSlug, code, colorway]] of group.colorways.entries()) {
      const product = productsBySlug.get(sourceSlug);
      oldIds.push(product.id);
      const [productVariants, productImages] = await Promise.all([
        request(`product_variants?product_id=eq.${product.id}&select=id,sku,name,price_cents,stock_quantity,position`),
        request(`product_images?product_id=eq.${product.id}&select=id,storage_path,image_url,alt_text,position`),
      ]);
      if (productVariants.length !== 16 || productImages.length < 5) throw new Error(`Unexpected variant/image count for ${sourceSlug}. No changes made.`);
      for (const [sizePosition, variant] of productVariants.entries()) {
        const size = variant.sku.split('-EU').at(-1);
        if (!size) throw new Error(`Could not identify EU size for SKU ${variant.sku}.`);
        variants.push({ ...variant, product_id: anchor.id, name: size, price_cents: group.priceCents, attributes: { colorway, colorCode: code, size }, position: colorPosition * 100 + sizePosition });
      }
      for (const [imagePosition, image] of productImages.entries()) {
        images.push({ ...image, product_id: anchor.id, alt_text: `${group.name} — ${colorway} — Vue ${imagePosition + 1}`, position: colorPosition * 100 + imagePosition });
      }
    }
    const sourceIds = oldIds.filter((id) => id !== anchor.id);
    work.push({ group, anchor, variants, images, sourceIds });
  }

  const variantIds = work.flatMap((item) => item.variants.map((variant) => variant.id));
  const orderItems = await request(`order_items?product_variant_id=in.(${variantIds.join(',')})&select=id,product_variant_id`);
  if (orderItems.length) throw new Error(`Safety check failed: ${orderItems.length} order item(s) refer to these variants. No records changed.`);

  for (const item of work) {
    console.log(`${item.group.name}: consolidate ${item.group.colorways.length} colorways, ${item.variants.length} sizes/colorways, ${item.images.length} images into /produit/${item.group.slug}`);
  }
  console.log('No order-history references found.');
  if (process.env.APPLY !== '1') {
    console.log('Dry run only. Set APPLY=1 to consolidate these Saucony rows.');
    return;
  }

  for (const item of work) {
    await request(`products?id=eq.${item.anchor.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: item.group.name, slug: item.group.slug, brand: 'Saucony', description: item.group.description, price_cents: item.group.priceCents, status: 'active' }),
    });
    await request('product_variants?on_conflict=id', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(item.variants),
    });
    await request('product_images?on_conflict=id', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(item.images),
    });
    if (item.sourceIds.length) await request(`products?id=in.(${item.sourceIds.join(',')})`, { method: 'DELETE' });
    console.log(`Consolidated ${item.group.name}.`);
  }
  console.log('Saucony model/colorway consolidation complete. Existing image objects, image URLs, SKUs, and inventory quantities were retained.');
};

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
