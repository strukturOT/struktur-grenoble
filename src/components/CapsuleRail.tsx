import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { capsuleCampaigns } from '../data/campaigns';

export default function CapsuleRail() {
  const rail = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ previous: false, next: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = rail.current;
    if (!element) return undefined;
    const update = () => setCanScroll({
      previous: element.scrollLeft > 8,
      next: element.scrollLeft + element.clientWidth < element.scrollWidth - 8,
    });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, []);

  const scroll = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: reduceMotion ? 'instant' : 'smooth' });
  };

  return (
    <section id="capsules" aria-labelledby="capsules-title" className="scroll-mt-24 py-12 md:py-20">
      <div className="mx-auto mb-6 flex max-w-[1600px] items-center justify-between gap-4 px-4 md:mb-9 md:px-10 lg:px-14">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-theme-ink/60">À découvrir</p>
          <h2 id="capsules-title" className="font-display text-3xl font-medium md:text-5xl">Les capsules.</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll(-1)} disabled={!canScroll.previous} aria-label="Capsules précédentes" aria-controls="capsules-rail" className="flex h-11 w-11 items-center justify-center rounded-full border border-theme-ink/20 transition-colors hover:bg-theme-ink hover:text-white disabled:cursor-default disabled:opacity-25"><ArrowLeft size={19} /></button>
          <button type="button" onClick={() => scroll(1)} disabled={!canScroll.next} aria-label="Capsules suivantes" aria-controls="capsules-rail" className="flex h-11 w-11 items-center justify-center rounded-full border border-theme-ink/20 transition-colors hover:bg-theme-ink hover:text-white disabled:cursor-default disabled:opacity-25"><ArrowRight size={19} /></button>
        </div>
      </div>
      <div ref={rail} id="capsules-rail" className="capsule-rail mx-auto flex max-w-[1600px] snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 md:gap-6 md:px-10 lg:px-14">
        {capsuleCampaigns.map((capsule) => (
          <Link key={capsule.title} to={capsule.href} className="group min-w-0 basis-[86%] shrink-0 snap-start sm:basis-[62%] lg:basis-[43%]">
            <div className="aspect-[4/3] overflow-hidden bg-theme-surface">
              <img src={capsule.image} srcSet={`${capsule.mobileImage} 900w, ${capsule.image} ${capsule.width}w`} sizes="(min-width: 1024px) 43vw, (min-width: 640px) 62vw, 86vw" alt={capsule.alt} loading="lazy" width={capsule.width} height={capsule.height} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transform-none" />
            </div>
            <div className="flex items-start justify-between gap-4 pb-1 pt-4">
              <div><h3 className="font-display text-2xl font-medium md:text-3xl">{capsule.title}</h3><p className="mt-1 text-xs text-theme-ink/65 md:text-sm">{capsule.label}</p></div>
              <ArrowUpRight aria-hidden="true" className="mt-1 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={22} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
