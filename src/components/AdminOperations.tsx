import { Mail, ShieldCheck, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContactMessage, StoreCustomer, StoreOrder } from '../lib/commerce';

type Props = {
  section: 'messages' | 'clients' | 'access';
  customers: StoreCustomer[];
  messages: ContactMessage[];
  orders: StoreOrder[];
  onRoleChange: (customerId: string, role: StoreCustomer['role']) => Promise<void>;
  onMessageStatusChange: (messageId: string, status: ContactMessage['status']) => Promise<void>;
};

const shortDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));

export const AdminOperations = ({ section, customers, messages, orders, onRoleChange, onMessageStatusChange }: Props) => {
  const admins = customers.filter((customer) => customer.role === 'admin');
  const clientOrders = (customerId: string) => orders.filter((order) => order.userId === customerId);

  return <>
    {section === 'messages' && <section className="py-4">
      <OperationHeading eyebrow="Relation client" title="Messages reçus" detail={`${messages.filter((message) => message.status === 'new').length} nouveau${messages.filter((message) => message.status === 'new').length > 1 ? 'x' : ''}`} icon={<Mail size={17} />} />
      {messages.length === 0 ? <Empty icon={<Mail size={24} />} title="Aucun message reçu." detail="Les demandes envoyées depuis Le Shop arriveront ici." /> : <div className="overflow-x-auto border-y border-white/10"><table className="w-full min-w-[820px] text-left"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/40"><tr><th className="px-3 py-4 font-medium">Expéditeur</th><th className="px-3 py-4 font-medium">Message</th><th className="px-3 py-4 font-medium">Reçu</th><th className="px-3 py-4 font-medium">Suivi</th></tr></thead><tbody>{messages.map((message) => <tr key={message.id} className="border-b border-white/10 last:border-0"><td className="px-3 py-4"><p className="font-medium text-white/85">{message.fullName}</p><a href={`mailto:${message.email}`} className="mt-1 text-xs text-white/45 transition-colors hover:text-struktur-orange">{message.email}</a></td><td className="max-w-md px-3 py-4 text-sm font-light leading-relaxed text-white/70">{message.message}</td><td className="px-3 py-4 text-xs text-white/50">{shortDate(message.createdAt)}</td><td className="px-3 py-4"><select value={message.status} onChange={(event) => void onMessageStatusChange(message.id, event.target.value as ContactMessage['status'])} className="border border-white/15 bg-[#0b0b0c] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/75 outline-none focus:border-struktur-orange"><option value="new">Nouveau</option><option value="read">Lu</option><option value="closed">Clos</option></select></td></tr>)}</tbody></table></div>}
    </section>}

    {section === 'clients' && <section className="py-4">
      <OperationHeading eyebrow="Comptes" title="Clients" detail={`${customers.filter((customer) => customer.role === 'customer').length} client${customers.filter((customer) => customer.role === 'customer').length > 1 ? 's' : ''}`} icon={<UsersRound size={17} />} />
      {customers.length === 0 ? <Empty icon={<UsersRound size={24} />} title="Aucun compte client." detail="Les comptes créés depuis le site apparaîtront ici." /> : <div className="overflow-x-auto border-y border-white/10"><table className="w-full min-w-[840px] text-left"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/40"><tr><th className="px-3 py-4 font-medium">Client</th><th className="px-3 py-4 font-medium">Commandes</th><th className="px-3 py-4 font-medium">Inscription</th><th className="px-3 py-4 font-medium">Accès</th></tr></thead><tbody>{customers.map((customer) => { const customerOrders = clientOrders(customer.id); return <tr key={customer.id} className="border-b border-white/10 last:border-0"><td className="px-3 py-4"><p className="font-medium text-white/85">{customer.fullName || 'Client sans nom'}</p><p className="mt-1 text-xs text-white/45">{customer.email || 'E-mail non disponible'}</p></td><td className="px-3 py-4 text-sm text-white/70">{customerOrders.length}<span className="ml-2 text-xs text-white/40">{customerOrders.length > 0 ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(customerOrders.reduce((sum, order) => sum + order.totalCents, 0) / 100) : '—'}</span></td><td className="px-3 py-4 text-xs text-white/50">{shortDate(customer.createdAt)}</td><td className="px-3 py-4"><select value={customer.role} onChange={(event) => void onRoleChange(customer.id, event.target.value as StoreCustomer['role'])} className="border border-white/15 bg-[#0b0b0c] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/75 outline-none focus:border-struktur-orange"><option value="customer">Client</option><option value="admin">Administrateur</option></select></td></tr>; })}</tbody></table></div>}
    </section>}

    {section === 'access' && <section className="py-4">
      <OperationHeading eyebrow="Sécurité" title="Accès administrateur" detail={`${admins.length} accès actif${admins.length > 1 ? 's' : ''}`} icon={<ShieldCheck size={17} />} />
      <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{admins.map((admin) => <div key={admin.id} className="bg-[#0b0b0c] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-struktur-orange">Administrateur</p><p className="mt-4 text-xl font-display">{admin.fullName || 'Sans nom'}</p><p className="mt-1 text-sm text-white/45">{admin.email || 'E-mail non disponible'}</p><p className="mt-5 text-xs text-white/35">Accès attribué le {shortDate(admin.createdAt)}</p></div>)}</div>
      <p className="mt-4 max-w-2xl text-xs font-light leading-relaxed text-white/40">Attribuez ou retirez un accès dans la liste Clients. La base refuse automatiquement de retirer le dernier administrateur, afin que le panneau reste toujours récupérable.</p>
    </section>}
  </>;
};

const OperationHeading = ({ eyebrow, title, detail, icon }: { eyebrow: string; title: string; detail: string; icon: ReactNode }) => <div className="mb-7 flex items-end justify-between gap-5"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-struktur-orange">{eyebrow}</p><div className="flex items-center gap-3"><span className="text-white/45">{icon}</span><h2 className="text-3xl font-display sm:text-4xl">{title}</h2></div></div><p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{detail}</p></div>;

const Empty = ({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) => <div className="border border-dashed border-white/15 px-6 py-12 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/50">{icon}</div><h3 className="mt-5 text-2xl font-display">{title}</h3><p className="mx-auto mt-3 max-w-md text-sm font-light leading-relaxed text-white/50">{detail}</p></div>;
