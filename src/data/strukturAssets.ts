// Central STRUKTUR V2 Asset Manifest
// All image paths organized by section and purpose

export const strukturAssets = {
  home: {
    hero: '/images/struktur-v2/home/struktur-hero-rooftop-grenoble.webp',
  },

  editorial: {
    rooftopSeated: '/images/struktur-v2/editorial/struktur-editorial-rooftop-seated.webp',
    rooftopTennis: '/images/struktur-v2/editorial/struktur-editorial-rooftop-tennis.webp',
    alleyCamel: '/images/struktur-v2/editorial/struktur-editorial-alley-camel.webp',
    knitTerracottaBag: '/images/struktur-v2/editorial/struktur-editorial-knit-terracotta-bag.webp',
    greyJacket: '/images/struktur-v2/editorial/struktur-editorial-grey-jacket.webp',
    blackSweater: '/images/struktur-v2/editorial/struktur-editorial-black-sweater.webp',
  },

  products: {
    sauconyOmni9Stone: '/images/struktur-v2/products/struktur-saucony-omni9-stone.webp',
    sauconyOmni9Deck: '/images/struktur-v2/products/struktur-saucony-omni9-deck.webp',
    sauconyOmni9Display: '/images/struktur-v2/products/struktur-product-sneaker-saucony-display.webp',
    sauconyOmni9Display2: '/images/struktur-v2/products/struktur-product-sneaker-saucony-display-2.webp',
    crossbodyTerracotta: '/images/struktur-v2/products/struktur-crossbody-terracotta.webp',
    oasPatternedSet: '/images/struktur-v2/products/struktur-product-oas-patterned-set.webp',
    denimJacket: '/images/struktur-v2/products/struktur-product-denim-jacket.webp',
  },

  brands: {
    newAmsterdam: '/images/struktur-v2/brands/struktur-brand-new-amsterdam.webp',
  },

  moto: {
    orangeEditorial: '/images/struktur-v2/moto/struktur-moto-orange-editorial.webp',
  },

  lookbook: {
    streetGraffiti: '/images/struktur-v2/lookbook/struktur-lookbook-street-graffiti.webp',
    storefrontBlue: '/images/struktur-v2/lookbook/struktur-lookbook-storefront-blue.webp',
    lifestyleScooter: '/images/struktur-v2/lookbook/struktur-lifestyle-scooter.webp',
  },

  shop: {
    modelBlackYellow: '/images/struktur-v2/shop/struktur-shop-model-black-yellow.webp',
    mirrorCream: '/images/struktur-v2/shop/struktur-shop-mirror-cream.webp',
    modelSweatBack: '/images/struktur-v2/shop/struktur-shop-model-sweat-back.webp',
    interiorWide: '/images/struktur-v2/shop/struktur-shop-interior-wide.webp',
    foosball: '/images/struktur-v2/shop/struktur-shop-foosball.webp',
    interiorWide2: '/images/struktur-v2/shop/struktur-shop-interior-wide-2.webp',
  },
} as const;

export type StrukturAssets = typeof strukturAssets;
