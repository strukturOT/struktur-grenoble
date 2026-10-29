import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { heroCampaigns } from '../data/campaigns';

const SLIDE_DURATION = 6000;

function adjacentSlide(current: number, direction: number, ready: number[]) {
  for (let step = 1; step < heroCampaigns.length; step += 1) {
    const index = (current + direction * step + heroCampaigns.length) % heroCampaigns.length;
    if (ready.includes(index)) return index;
  }
  return current;
}

export default function Hero() {
  const hero = useRef<HTMLElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const inView = useInView(hero, { amount: 0.2 });
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState<number[]>([]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [motionOptIn, setMotionOptIn] = useState(false);
  const [cycleVersion, setCycleVersion] = useState(0);
  const [hoveredLink, setHoveredLink] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const campaign = heroCampaigns[active];
  const motionEnabled = !reduceMotion || motionOptIn;
  const playing = autoPlay && motionEnabled;
  const canAnimate = playing && inView && pageVisible;
  const canRotate = canAnimate && !hoveredLink && !focused && !touching;

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!canRotate || ready.length < 2) return undefined;
    const timer = window.setTimeout(() => setActive(adjacentSlide(active, 1, ready)), SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [active, canRotate, ready, cycleVersion]);

  const selectSlide = (index: number) => {
    if (!ready.includes(index)) return;
    setActive(index);
    setCycleVersion((version) => version + 1);
    setAnnouncement(heroCampaigns[index].title);
  };

  const finishGesture = (event: PointerEvent<HTMLElement>) => {
    if (!gesture.current) return;
    const { x, y } = gesture.current;
    gesture.current = null;
    setTouching(false);
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      selectSlide(adjacentSlide(active, dx < 0 ? 1 : -1, ready));
    }
  };

  return (
    <section
      ref={hero}
      aria-labelledby="home-campaign-title"
      aria-roledescription="carrousel"
      data-motion={motionEnabled ? 'enabled' : 'reduced'}
      className="hero-carousel relative isolate mt-[72px] overflow-hidden bg-[#181715] text-white md:mt-20"
      onPointerOver={(event) => setHoveredLink(event.pointerType === 'mouse' && Boolean((event.target as Element).closest('a')))}
      onPointerLeave={() => setHoveredLink(false)}
      onFocusCapture={(event) => setFocused(event.target.matches(':focus-visible'))}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onPointerDown={(event) => {
        setFocused(false);
        if (event.pointerType !== 'touch' || !event.isPrimary) return;
        gesture.current = { x: event.clientX, y: event.clientY };
        setTouching(true);
      }}
      onPointerUp={finishGesture}
      onPointerCancel={() => { gesture.current = null; setTouching(false); }}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        selectSlide(adjacentSlide(active, event.key === 'ArrowLeft' ? -1 : 1, ready));
      }}
    >
      <h1 id="home-campaign-title" className="sr-only">Streetwear, sneakers et accessoires : la sélection STRUKTUR Grenoble</h1>
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {heroCampaigns.map((slide, index) => (
          <div key={slide.title} className="hero-slide absolute inset-0" style={{ opacity: index === active ? 1 : 0 }} data-active={index === active}>
            <img src={slide.image} srcSet={`${slide.mobileImage} 900w, ${slide.image} ${slide.width}w`} sizes="100vw" alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="hero-backdrop absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="hero-artwork-frame">
              <img
                src={slide.image}
                srcSet={`${slide.mobileImage} 900w, ${slide.image} ${slide.width}w`}
                sizes="(min-width: 768px) 84vw, 100vw"
                alt=""
                width={slide.width}
                height={slide.height}
                fetchPriority={index === 0 ? 'high' : 'low'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                onLoad={() => setReady((previous) => previous.includes(index) ? previous : [...previous, index])}
                className="hero-photo h-full w-full object-contain"
                style={{ animationPlayState: canAnimate ? 'running' : 'paused' }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="hero-shade pointer-events-none absolute inset-0 z-10" />
      <div className="relative z-20 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-5 pb-24 pt-6 md:px-10 md:pb-28 lg:px-14">
        <motion.div key={campaign.title} initial={motionEnabled ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: motionEnabled ? 0.5 : 0 }} aria-live="off">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em] text-white/85 md:mb-5 md:text-xs">{campaign.label}</p>
          <h2 className="max-w-5xl text-balance font-display text-[clamp(3rem,8vw,8rem)] font-medium leading-[0.98]">{campaign.title}</h2>
          <div className="mt-5 md:mt-8">
            <Link to={campaign.href} className="inline-flex min-h-12 items-center justify-center bg-white px-9 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:bg-struktur-orange hover:text-white">
              Shop now
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-4 z-20 mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 md:bottom-6 md:px-10 lg:px-14">
        <div className="flex" aria-label="Choisir une collection">
          {heroCampaigns.map((slide, index) => (
            <button key={slide.title} type="button" aria-label={`Afficher ${slide.title}`} aria-pressed={index === active} disabled={!ready.includes(index)} onClick={() => selectSlide(index)} className="flex h-11 w-11 items-center justify-center disabled:opacity-30">
              <span className={`pointer-events-none h-1.5 overflow-hidden rounded-full bg-white/50 ${index === active ? 'w-7' : 'w-1.5'}`}>
                {index === active && <span key={`${active}-${cycleVersion}-${canRotate}`} className="hero-progress block h-full w-full bg-white" style={{ animationPlayState: canRotate ? 'running' : 'paused' }} />}
              </span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { if (!motionEnabled) { setMotionOptIn(true); setAutoPlay(true); } else setAutoPlay(!autoPlay); setHoveredLink(false); setFocused(false); setCycleVersion((version) => version + 1); }} className="sr-only focus:not-sr-only focus:absolute focus:bottom-0 focus:right-5 focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:text-black">{!motionEnabled ? 'Activer les animations' : playing ? 'Mettre le défilement en pause' : 'Reprendre le défilement'}</button>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </section>
  );
}
