import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Box, CheckCircle2, ImagePlus, Layers3, LayoutDashboard, Mail, Package, Plus, RefreshCw, ShieldCheck, ShoppingBag, Tags, UsersRound, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { createCategory, createProduct, deleteCategory, formatMoney, getAdminCategories, getAdminCustomers, getAdminMessages, getAdminOrders, getAdminProducts, productImage, updateCategory, type ContactMessage, type ProductStatus, type StoreCategory, type StoreCustomer, type StoreOrder, type StoreProduct, updateCustomerRole, updateMessageStatus, updateProduct, updateProductStatus } from '../lib/commerce';
import { AdminOperations } from '../components/AdminOperations';
import { formatFileSize } from '../lib/imageOptimization';

type VariantDraft = { id: string; variantId?: string; name: string; sku: string; price: string; stock: string };
export type AdminPage = 'overview' | 'catalogue' | 'categories' | 'orders' | 'messages' | 'clients' | 'access';

const createVariant = (): VariantDraft => ({ id: crypto.randomUUID(), name: '', sku: '', price: '', stock: '0' });
const createInitialForm = () => ({ name: '', slug: '', brand: '', description: '', price: '', currency: 'EUR', status: 'draft' as ProductStatus, featured: false, categoryId: '' });
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const Admin = ({ page = 'overview' }: { page?: AdminPage }) => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [panelProduct, setPanelProduct] = useState<StoreProduct | null | undefined>(undefined);
  const [panelCategory, setPanelCategory] = useState<StoreCategory | null | undefined>(undefined);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    const needsProducts = page === 'overview' || page === 'catalogue';
    const needsCategories = needsProducts || page === 'categories';
    const needsOrders = page === 'overview' || page === 'orders' || page === 'clients';
    const needsCustomers = page === 'overview' || page === 'clients' || page === 'access';
    const needsMessages = page === 'overview' || page === 'messages';
    const [productResult, categoryResult, orderResult, customerResult, messageResult] = await Promise.all([
      needsProducts ? getAdminProducts() : Promise.resolve({ data: [] as StoreProduct[] }),
      needsCategories ? getAdminCategories() : Promise.resolve({ data: [] as StoreCategory[] }),
      needsOrders ? getAdminOrders() : Promise.resolve({ data: [] as StoreOrder[] }),
      needsCustomers ? getAdminCustomers() : Promise.resolve({ data: [] as StoreCustomer[] }),
      needsMessages ? getAdminMessages() : Promise.resolve({ data: [] as ContactMessage[] }),
    ]);
    setProducts(productResult.data);
    setCategories(categoryResult.data);
    setOrders(orderResult.data);
    setCustomers(customerResult.data);
    setMessages(messageResult.data);
    setIsLoading(false);
  }, [page]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const metrics = useMemo(() => {
    const inventory = products.reduce((total, product) => total + product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0), 0);
    const lowStock = products.filter((product) => product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0) <= 3).length;
    const paidRevenue = orders.filter((order) => order.paymentStatus === 'paid').reduce((total, order) => total + order.totalCents, 0);
    const activeOrders = orders.filter((order) => ['paid', 'processing'].includes(order.status)).length;
    return { inventory, lowStock, paidRevenue, activeOrders, published: products.filter((product) => product.status === 'active').length, newMessages: messages.filter((message) => message.status === 'new').length, clients: customers.filter((customer) => customer.role === 'customer').length };
  }, [customers, messages, orders, products]);

  const changeStatus = async (productId: string, status: ProductStatus) => {
    await updateProductStatus(productId, status);
    await loadDashboard();
  };

  const changeRole = async (customerId: string, role: StoreCustomer['role']) => {
    try { await updateCustomerRole(customerId, role); await loadDashboard(); } catch (error) { window.alert(error instanceof Error ? error.message : 'Impossible de modifier cet accès.'); }
  };

  const changeMessageStatus = async (messageId: string, status: ContactMessage['status']) => {
    try { await updateMessageStatus(messageId, status); await loadDashboard(); } catch (error) { window.alert(error instanceof Error ? error.message : 'Impossible de modifier ce message.'); }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f2f0ec]">
      <AdminNavigation adminName={profile?.fullName} onRefresh={loadDashboard} isLoading={isLoading} />
      <main className="mx-auto max-w-[1560px] px-5 pb-16 pt-36 md:ml-[248px] md:px-10 md:pt-12 xl:px-14">
        {page === 'overview' && <section className="border-b border-white/10 pb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-struktur-orange">Struktur · opérations</p>
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-5xl font-display tracking-tight sm:text-6xl xl:text-7xl">Tableau de bord</h1><p className="mt-3 max-w-lg text-sm font-light leading-relaxed text-white/50">Les indicateurs essentiels, avec un accès direct à chaque espace de gestion.</p></div><NavLink to="/admin/catalogue" className="inline-flex w-fit items-center gap-3 bg-struktur-orange px-5 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#ff5511]"><Plus size={16} />Nouveau produit</NavLink></div>
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-7"><Metric label="Produits publiés" value={metrics.published} icon={<Package size={17} />} /><Metric label="Stock total" value={metrics.inventory} icon={<Box size={17} />} /><Metric label="Stock bas" value={metrics.lowStock} icon={<AlertTriangle size={17} />} warning={metrics.lowStock > 0} /><Metric label="Commandes à traiter" value={metrics.activeOrders} icon={<ShoppingBag size={17} />} /><Metric label="CA encaissé" value={formatMoney(metrics.paidRevenue)} icon={<CheckCircle2 size={17} />} /><Metric label="Clients" value={metrics.clients} icon={<UsersRound size={17} />} /><Metric label="Messages nouveaux" value={metrics.newMessages} icon={<Mail size={17} />} warning={metrics.newMessages > 0} /></div>
          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3"><DashboardLink to="/admin/catalogue" label="Catalogue" detail="Produits, variantes et stock" icon={<Layers3 size={18} />} /><DashboardLink to="/admin/commandes" label="Commandes" detail="Ventes et traitement" icon={<ShoppingBag size={18} />} /><DashboardLink to="/admin/messages" label="Messages" detail="Demandes clients" icon={<Mail size={18} />} /></div>
        </section>}

        {page === 'catalogue' && <section className="py-4">
          <SectionHeading eyebrow="Inventaire" title="Catalogue" detail={`${products.length} produit${products.length > 1 ? 's' : ''}`} action={<div className="flex items-center gap-2"><NavLink to="/admin/categories" className="hidden items-center gap-2 border border-white/20 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-struktur-orange hover:text-struktur-orange sm:inline-flex"><Tags size={14} />Catégories</NavLink><button type="button" onClick={() => setPanelProduct(null)} className="hidden items-center gap-2 border border-white/20 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-struktur-orange hover:text-struktur-orange sm:inline-flex"><Plus size={14} />Ajouter</button></div>} />
          {isLoading ? <TableSkeleton rows={4} /> : products.length > 0 ? <div className="overflow-x-auto border-y border-white/10"><table className="w-full min-w-[870px] text-left"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/40"><tr><th className="px-3 py-4 font-medium">Produit</th><th className="px-3 py-4 font-medium">Référence</th><th className="px-3 py-4 font-medium">Stock</th><th className="px-3 py-4 font-medium">Prix</th><th className="px-3 py-4 font-medium">Statut</th><th className="px-3 py-4 font-medium">Actions</th></tr></thead><tbody>{products.map((product) => <ProductRow key={product.id} product={product} onStatusChange={changeStatus} onEdit={setPanelProduct} />)}</tbody></table></div> : <EmptyWorkspace icon={<Package size={26} />} title="Votre catalogue est vide." detail="Créez votre premier produit, ses variantes et son image. Il restera en brouillon jusqu’à ce que vous le publiiez." actionLabel="Créer le premier produit" onAction={() => setPanelProduct(null)} />}
        </section>}

        {page === 'categories' && <section className="py-4">
          <SectionHeading eyebrow="Organisation" title="Catégories" detail={`${categories.length} catégorie${categories.length > 1 ? 's' : ''}`} action={<button type="button" onClick={() => setPanelCategory(null)} className="inline-flex items-center gap-2 border border-white/20 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-struktur-orange hover:text-struktur-orange"><Plus size={14} />Nouvelle catégorie</button>} />
          <p className="mb-9 max-w-xl text-sm font-light leading-relaxed text-white/50">Créez des univers clairs pour votre boutique. Chaque catégorie peut avoir son visuel, son texte éditorial et ses produits associés.</p>
          {isLoading ? <TableSkeleton rows={4} /> : categories.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categories.map((category) => <CategoryCard key={category.id} category={category} onEdit={setPanelCategory} onDelete={async () => { if (!window.confirm(`Supprimer « ${category.name} » ? Les produits resteront dans le catalogue.`)) return; try { await deleteCategory(category); await loadDashboard(); } catch (error) { window.alert(error instanceof Error ? error.message : 'Impossible de supprimer la catégorie.'); } }} />)}</div> : <EmptyWorkspace icon={<Tags size={26} />} title="Aucune catégorie." detail="Commencez par créer un univers pour structurer votre boutique." actionLabel="Créer une catégorie" onAction={() => setPanelCategory(null)} />}
        </section>}

        {page === 'orders' && <section className="py-4">
          <SectionHeading eyebrow="Ventes" title="Commandes" detail={`${orders.length} récente${orders.length > 1 ? 's' : ''}`} />
          {isLoading ? <TableSkeleton rows={3} /> : orders.length > 0 ? <div className="overflow-x-auto border-y border-white/10"><table className="w-full min-w-[680px] text-left"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/40"><tr><th className="px-3 py-4 font-medium">Commande</th><th className="px-3 py-4 font-medium">Date</th><th className="px-3 py-4 font-medium">Paiement</th><th className="px-3 py-4 font-medium">Statut</th><th className="px-3 py-4 font-medium">Total</th></tr></thead><tbody>{orders.map((order) => <OrderRow key={order.id} order={order} />)}</tbody></table></div> : <EmptyWorkspace icon={<ShoppingBag size={26} />} title="Aucune commande à afficher." detail="Les commandes apparaîtront ici uniquement après confirmation du paiement sécurisé." />}
        </section>}
        {page === 'messages' && <AdminOperations section="messages" customers={customers} messages={messages} orders={orders} onRoleChange={changeRole} onMessageStatusChange={changeMessageStatus} />}
        {page === 'clients' && <AdminOperations section="clients" customers={customers} messages={messages} orders={orders} onRoleChange={changeRole} onMessageStatusChange={changeMessageStatus} />}
        {page === 'access' && <AdminOperations section="access" customers={customers} messages={messages} orders={orders} onRoleChange={changeRole} onMessageStatusChange={changeMessageStatus} />}
      </main>
      <AnimatePresence>{panelProduct !== undefined && <ProductPanel product={panelProduct} categories={categories} onClose={() => setPanelProduct(undefined)} onSaved={async () => { setPanelProduct(undefined); await loadDashboard(); }} />}</AnimatePresence>
      <AnimatePresence>{panelCategory !== undefined && <CategoryPanel category={panelCategory} onClose={() => setPanelCategory(undefined)} onSaved={async () => { setPanelCategory(undefined); await loadDashboard(); }} />}</AnimatePresence>
    </div>
  );
};

const AdminNavigation = ({ adminName, onRefresh, isLoading }: { adminName: string | null | undefined; onRefresh: () => void; isLoading: boolean }) => <>
  <aside className="fixed inset-x-0 top-0 z-40 flex h-[68px] items-center justify-between border-b border-white/10 bg-[#0b0b0c]/95 px-5 backdrop-blur-md md:inset-y-0 md:left-0 md:right-auto md:h-screen md:w-[248px] md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-6 md:py-8">
    <a href="/" className="font-display text-xl font-bold tracking-[0.18em]">STRUKTUR</a>
    <nav className="absolute left-0 top-full flex w-screen overflow-x-auto border-b border-white/10 bg-[#0b0b0c]/95 px-2 py-1 backdrop-blur-md md:static md:block md:w-auto md:space-y-1 md:border-0 md:bg-transparent md:px-0 md:py-0"><AdminNavItem to="/admin" end icon={<LayoutDashboard size={16} />} label="Vue d’ensemble" /><AdminNavItem to="/admin/catalogue" icon={<Layers3 size={16} />} label="Catalogue" /><AdminNavItem to="/admin/categories" icon={<Tags size={16} />} label="Catégories" /><AdminNavItem to="/admin/commandes" icon={<ShoppingBag size={16} />} label="Commandes" /><AdminNavItem to="/admin/messages" icon={<Mail size={16} />} label="Messages" /><AdminNavItem to="/admin/clients" icon={<UsersRound size={16} />} label="Clients" /><AdminNavItem to="/admin/acces" icon={<ShieldCheck size={16} />} label="Accès équipe" /></nav>
    <div className="flex items-center gap-4 md:flex-col md:items-stretch md:gap-5"><button type="button" onClick={onRefresh} aria-label="Actualiser les données" className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-struktur-orange"><RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /><span className="hidden md:inline">Actualiser</span></button><div className="hidden border-t border-white/10 pt-5 md:block"><p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Connecté en tant que</p><p className="mt-1 truncate text-sm text-white/70">{adminName || 'Administrateur'}</p><a href="/" className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-struktur-orange">Voir le site <ArrowUpRight size={13} /></a></div></div>
  </aside>
</>;

const AdminNavItem = ({ to, icon, label, end = false }: { to: string; icon: ReactNode; label: string; end?: boolean }) => <NavLink to={to} end={end} className={({ isActive }) => `shrink-0 flex items-center gap-2 px-3 py-2.5 text-xs transition-colors md:gap-3 md:py-3 md:text-sm ${isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}>{icon}{label}</NavLink>;

const Metric = ({ label, value, icon, warning = false }: { label: string; value: string | number; icon: ReactNode; warning?: boolean }) => <div className="min-h-32 bg-[#0b0b0c] p-5"><div className={`flex items-center justify-between ${warning ? 'text-struktur-orange' : 'text-white/45'}`}><p className="text-[10px] uppercase tracking-[0.16em]">{label}</p>{icon}</div><p className="mt-6 text-3xl font-display tracking-tight">{value}</p></div>;

const DashboardLink = ({ to, label, detail, icon }: { to: string; label: string; detail: string; icon: ReactNode }) => <NavLink to={to} className="group flex items-center justify-between bg-[#0b0b0c] p-5 transition-colors hover:bg-white/5"><div><p className="font-display text-xl">{label}</p><p className="mt-2 text-xs text-white/45">{detail}</p></div><span className="text-white/40 transition-colors group-hover:text-struktur-orange">{icon}</span></NavLink>;

const SectionHeading = ({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) => <div className="mb-7 flex items-end justify-between gap-5"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-struktur-orange">{eyebrow}</p><h2 className="text-3xl font-display sm:text-4xl">{title}</h2></div><div className="flex items-center gap-5"><p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{detail}</p>{action}</div></div>;

const ProductRow = ({ product, onStatusChange, onEdit }: { product: StoreProduct; onStatusChange: (id: string, status: ProductStatus) => Promise<void>; onEdit: (product: StoreProduct) => void }) => {
  const stock = product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  const image = productImage(product);
  return <tr className="border-b border-white/10 last:border-0"><td className="px-3 py-4"><div className="flex items-center gap-4"><div className="h-14 w-11 shrink-0 overflow-hidden bg-white/5">{image && <img src={image} alt="" className="h-full w-full object-cover" />}</div><div><p className="font-display text-lg">{product.name}</p><p className="mt-1 text-xs text-white/45">{product.brand || 'Sans marque'} · {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}</p></div></div></td><td className="px-3 py-4 text-xs text-white/55">{product.variants.map((variant) => variant.sku).join(', ')}</td><td className={`px-3 py-4 text-sm ${stock <= 3 ? 'text-struktur-orange' : 'text-white/75'}`}>{stock}</td><td className="px-3 py-4 text-sm">{formatMoney(product.priceCents, product.currency)}</td><td className="px-3 py-4"><select value={product.status} onChange={(event) => void onStatusChange(product.id, event.target.value as ProductStatus)} className="border border-white/15 bg-[#0b0b0c] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/75 outline-none transition-colors focus:border-struktur-orange"><option value="draft">Brouillon</option><option value="active">En ligne</option><option value="archived">Archivé</option></select></td><td className="px-3 py-4"><button type="button" onClick={() => onEdit(product)} className="border-b border-white/30 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-struktur-orange hover:text-struktur-orange">Modifier</button></td></tr>;
};

const OrderRow = ({ order }: { order: StoreOrder }) => <tr className="border-b border-white/10 last:border-0"><td className="px-3 py-4 font-display text-lg">#{order.orderNumber}</td><td className="px-3 py-4 text-sm text-white/60">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(order.createdAt))}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.13em] ${order.paymentStatus === 'paid' ? 'bg-green-400/10 text-green-300' : 'bg-white/10 text-white/55'}`}>{order.paymentStatus}</span></td><td className="px-3 py-4 text-xs uppercase tracking-[0.14em] text-white/65">{order.status.replaceAll('_', ' ')}</td><td className="px-3 py-4 text-sm">{formatMoney(order.totalCents, order.currency)}</td></tr>;

const TableSkeleton = ({ rows }: { rows: number }) => <div className="space-y-px border-y border-white/10 bg-white/10">{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-20 animate-pulse bg-[#0b0b0c]" />)}</div>;

const EmptyWorkspace = ({ icon, title, detail, actionLabel, onAction }: { icon: ReactNode; title: string; detail: string; actionLabel?: string; onAction?: () => void }) => <div className="border border-dashed border-white/15 px-6 py-14 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/50">{icon}</div><h3 className="mt-5 text-2xl font-display">{title}</h3><p className="mx-auto mt-3 max-w-md text-sm font-light leading-relaxed text-white/50">{detail}</p>{actionLabel && onAction && <button type="button" onClick={onAction} className="mt-6 border-b border-struktur-orange pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-struktur-orange transition-colors hover:text-white">{actionLabel}</button>}</div>;

const ProductPanel = ({ product, categories, onClose, onSaved }: { product: StoreProduct | null; categories: StoreCategory[]; onClose: () => void; onSaved: () => Promise<void> }) => {
  const [form, setForm] = useState(createInitialForm);
  const [variants, setVariants] = useState<VariantDraft[]>([createVariant()]);
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMessage(null);
    setImage(null);
    if (!product) {
      setForm(createInitialForm());
      setVariants([createVariant()]);
      return;
    }
    setForm({
      name: product.name,
      slug: product.slug,
      brand: product.brand ?? '',
      description: product.description ?? '',
      price: (product.priceCents / 100).toFixed(2),
      currency: product.currency,
      status: product.status,
      featured: product.featured,
      categoryId: product.category?.id ?? '',
    });
    setVariants(product.variants.length > 0
      ? product.variants.map((variant) => ({
        id: crypto.randomUUID(),
        variantId: variant.id,
        name: variant.name ?? '',
        sku: variant.sku,
        price: variant.priceCents === null ? '' : (variant.priceCents / 100).toFixed(2),
        stock: String(variant.stockQuantity),
      }))
      : [createVariant()]);
  }, [product]);

  const updateVariant = (id: string, field: keyof Omit<VariantDraft, 'id'>, value: string) => setVariants((current) => current.map((variant) => variant.id === id ? { ...variant, [field]: value } : variant));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const input = {
        name: form.name.trim(), slug: form.slug.trim().toLowerCase(), brand: form.brand.trim(), description: form.description.trim(),
        priceCents: Math.round(Number(form.price) * 100), currency: form.currency, status: form.status, featured: form.featured,
        variants: variants.map((variant) => ({ id: variant.variantId, name: variant.name.trim(), sku: variant.sku.trim(), priceCents: variant.price ? Math.round(Number(variant.price) * 100) : null, stockQuantity: Number(variant.stock) })),
        categoryId: form.categoryId || null,
      };
      if (product) await updateProduct(product.id, input, image);
      else await createProduct(input, image);
      await onSaved();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer le produit.'); } finally { setSaving(false); }
  };

  return <><motion.button type="button" aria-label="Fermer" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] cursor-default bg-black/65 backdrop-blur-sm" /><motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="fixed inset-y-0 right-0 z-[90] w-full max-w-2xl overflow-y-auto bg-[#121214] p-6 text-[#f2f0ec] shadow-2xl sm:p-9"><div className="flex items-start justify-between border-b border-white/10 pb-7"><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-struktur-orange">Catalogue</p><h2 className="text-4xl font-display">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2></div><button type="button" onClick={onClose} className="p-2 text-white/55 transition-colors hover:text-struktur-orange" aria-label="Fermer"><X size={22} /></button></div><form onSubmit={submit} className="mt-8 space-y-8"><section className="space-y-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Informations</p><div className="grid gap-4 sm:grid-cols-2"><FormField label="Nom du produit" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><FormField label="Marque" value={form.brand} onChange={(value) => setForm({ ...form, brand: value })} /></div><FormField label="Slug" hint="unique, minuscules et tirets" value={form.slug} onChange={(value) => setForm({ ...form, slug: slugify(value) })} required /><label className="block text-[10px] uppercase tracking-[0.16em] text-white/45">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="mt-2 w-full resize-y border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal outline-none transition-colors focus:border-struktur-orange" /></label><label className="block text-[10px] uppercase tracking-[0.16em] text-white/45">Catégorie<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="mt-2 w-full border border-white/15 bg-[#121214] px-3 py-3 text-sm normal-case tracking-normal outline-none focus:border-struktur-orange"><option value="">Sans catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></section><section className="border-y border-white/10 py-8"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Prix & publication</p><div className="mt-4 grid gap-4 sm:grid-cols-3"><FormField label="Prix de base (€)" type="number" min="0" step="0.01" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required /><label className="block text-[10px] uppercase tracking-[0.16em] text-white/45">Statut<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductStatus })} className="mt-2 w-full border border-white/15 bg-[#121214] px-3 py-3 text-sm normal-case tracking-normal outline-none focus:border-struktur-orange"><option value="draft">Brouillon</option><option value="active">En ligne</option><option value="archived">Archivé</option></select></label><label className="flex items-end gap-3 pb-3 text-xs text-white/65"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} className="h-4 w-4 accent-struktur-orange" />Mettre en avant</label></div></section><section><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Variantes & stock</p><p className="mt-2 text-xs text-white/45">Ajoutez une ligne par taille, couleur ou référence vendue.</p></div><button type="button" onClick={() => setVariants((current) => [...current, createVariant()])} className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] transition-colors hover:border-struktur-orange hover:text-struktur-orange"><Plus size={13} />Variante</button></div><div className="mt-4 space-y-3">{variants.map((variant, index) => <div key={variant.id} className="border border-white/10 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs text-white/55">Variante {index + 1}</p>{variants.length > 1 && <button type="button" onClick={() => setVariants((current) => current.filter((item) => item.id !== variant.id))} className="text-[10px] uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-struktur-orange">Retirer</button>}</div><div className="grid gap-3 sm:grid-cols-4"><FormField label="Nom" placeholder="ex. M" value={variant.name} onChange={(value) => updateVariant(variant.id, 'name', value)} /><FormField label="SKU" value={variant.sku} onChange={(value) => updateVariant(variant.id, 'sku', value)} required /><FormField label="Prix (€)" placeholder="Prix de base" type="number" min="0" step="0.01" value={variant.price} onChange={(value) => updateVariant(variant.id, 'price', value)} /><FormField label="Stock" type="number" min="0" step="1" value={variant.stock} onChange={(value) => updateVariant(variant.id, 'stock', value)} required /></div></div>)}</div></section><section><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{product ? 'Ajouter une image' : 'Image principale'}</p><label className="mt-3 flex cursor-pointer items-center justify-center gap-3 border border-dashed border-white/20 px-5 py-8 text-sm text-white/55 transition-colors hover:border-struktur-orange hover:text-struktur-orange"><ImagePlus size={19} /><span>{image ? `${image.name} · ${formatFileSize(image.size)}` : 'Choisir une image'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="sr-only" /></label><p className="mt-2 text-xs text-white/40">Conversion WebP et compression automatique sous environ 450 Ko lors de l’enregistrement.{product ? ' L’image rejoindra la galerie du produit.' : ''}</p></section>{message && <p className="border border-struktur-orange/40 bg-struktur-orange/10 p-4 text-sm text-white/80">{message}</p>}<button disabled={saving} className="w-full bg-struktur-orange py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Optimisation et enregistrement…' : product ? 'Enregistrer les modifications' : 'Créer le produit'}</button></form></motion.aside></>;
};

const CategoryCard = ({ category, onEdit, onDelete }: { category: StoreCategory; onEdit: (category: StoreCategory) => void; onDelete: () => Promise<void> }) => <article className="group overflow-hidden border border-white/10 bg-white/[0.02]"><div className="flex gap-5 p-4"><div className="h-28 w-24 shrink-0 overflow-hidden bg-white/5">{category.imageUrl ? <img src={category.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-white/25"><Tags size={22} /></div>}</div><div className="min-w-0 flex-1 py-1"><p className="text-[10px] uppercase tracking-[0.18em] text-struktur-orange">{category.productCount} produit{category.productCount !== 1 ? 's' : ''}</p><h3 className="mt-2 truncate font-display text-2xl">{category.name}</h3><p className="mt-1 truncate text-xs text-white/40">/{category.slug}</p><div className="mt-5 flex items-center gap-4"><button type="button" onClick={() => onEdit(category)} className="text-[10px] uppercase tracking-[0.15em] text-white/65 transition-colors hover:text-struktur-orange">Modifier</button><button type="button" onClick={() => void onDelete()} className="text-[10px] uppercase tracking-[0.15em] text-white/35 transition-colors hover:text-red-300">Supprimer</button></div></div></div>{category.description && <p className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-white/45">{category.description}</p>}</article>;

const CategoryPanel = ({ category, onClose, onSaved }: { category: StoreCategory | null; onClose: () => void; onSaved: () => Promise<void> }) => {
  const [form, setForm] = useState({ name: '', slug: '', description: '', position: '0' });
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMessage(null);
    setImage(null);
    setForm(category ? { name: category.name, slug: category.slug, description: category.description ?? '', position: String(category.position) } : { name: '', slug: '', description: '', position: '0' });
  }, [category]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const input = { name: form.name.trim(), slug: form.slug.trim().toLowerCase(), description: form.description.trim(), position: Math.max(0, Number(form.position) || 0) };
      if (!input.name || !input.slug) throw new Error('Le nom et le slug sont obligatoires.');
      if (category) await updateCategory(category.id, input, image, category.storagePath);
      else await createCategory(input, image);
      await onSaved();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la catégorie.'); } finally { setSaving(false); }
  };

  return <><motion.button type="button" aria-label="Fermer" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] cursor-default bg-black/65 backdrop-blur-sm" /><motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }} className="fixed inset-y-0 right-0 z-[90] w-full max-w-xl overflow-y-auto bg-[#121214] p-6 text-[#f2f0ec] shadow-2xl sm:p-9"><div className="flex items-start justify-between border-b border-white/10 pb-7"><div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-struktur-orange">Organisation</p><h2 className="text-4xl font-display">{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2></div><button type="button" onClick={onClose} className="p-2 text-white/55 transition-colors hover:text-struktur-orange" aria-label="Fermer"><X size={22} /></button></div><form onSubmit={submit} className="mt-8 space-y-8"><section className="space-y-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Identité</p><FormField label="Nom" placeholder="ex. Sacs à dos" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><FormField label="Slug" hint="unique, minuscules et tirets" value={form.slug} onChange={(value) => setForm({ ...form, slug: slugify(value) })} required /><label className="block text-[10px] uppercase tracking-[0.16em] text-white/45">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} placeholder="Le texte présenté au-dessus de la sélection…" className="mt-2 w-full resize-y border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal outline-none transition-colors placeholder:text-white/25 focus:border-struktur-orange" /></label></section><section className="border-y border-white/10 py-8"><div className="grid gap-4 sm:grid-cols-2"><FormField label="Ordre d’affichage" hint="0 = en premier" type="number" min="0" step="1" value={form.position} onChange={(value) => setForm({ ...form, position: value })} /><div><p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Visuel de couverture</p><label className="mt-2 flex min-h-[49px] cursor-pointer items-center gap-3 border border-dashed border-white/20 px-3 text-xs text-white/55 transition-colors hover:border-struktur-orange hover:text-struktur-orange"><ImagePlus size={17} /><span className="truncate">{image ? `${image.name} · ${formatFileSize(image.size)}` : category?.imageUrl ? 'Remplacer le visuel' : 'Choisir une image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="sr-only" /></span></label></div></div><p className="mt-3 text-xs leading-relaxed text-white/40">L’image est automatiquement convertie en WebP et allégée avant son envoi.</p></section>{message && <p className="border border-struktur-orange/40 bg-struktur-orange/10 p-4 text-sm text-white/80">{message}</p>}<button disabled={saving} className="w-full bg-struktur-orange py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff5511] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Optimisation et enregistrement…' : category ? 'Enregistrer la catégorie' : 'Créer la catégorie'}</button></form></motion.aside></>;
};

const FormField = ({ label, hint, value, onChange, ...props }: { label: string; hint?: string; value: string; onChange: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) => <label className="block text-[10px] uppercase tracking-[0.16em] text-white/45">{label}{hint && <span className="ml-2 normal-case tracking-normal text-white/30">{hint}</span>}<input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal outline-none transition-colors placeholder:text-white/25 focus:border-struktur-orange" /></label>;

export default Admin;
