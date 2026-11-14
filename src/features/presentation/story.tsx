import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion, MotionConfig, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Flower2, Inbox, ClipboardList, Sprout, Settings2, Check, Heart, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import atelier from "@/assets/story-atelier.jpg";
import workbench from "@/assets/story-workbench.png";
import foreground from "@/assets/story-foreground.png";
import bouquet from "@/assets/story-bouquet.jpg";

function useStoryReducedMotion() {
  const prefersReduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated && Boolean(prefersReduced);
}

function EnterAtelier() {
  return <Button asChild size="lg" className="story-cta"><Link to="/inbox">Intră în atelier <ArrowRight /></Link></Button>;
}

function StoryTitle({ children, hero = false }: { children: string; hero?: boolean }) {
  const reduced = useStoryReducedMotion();
  const Tag = hero ? motion.h1 : motion.h2;
  return <Tag className="story-title" aria-label={children}>{children.split(" ").map((word, i) => <motion.span aria-hidden="true" key={`${word}-${i}`} initial={reduced ? false : { opacity: 0, y: 35 }} animate={reduced ? { opacity: 1, y: 0 } : {}} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : i * 0.08 }}>{word}{" "}</motion.span>)}</Tag>;
}

function IllustratedSection({ children, final = false }: { children: ReactNode; final?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useStoryReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], [-45, 65]);
  const middleY = useTransform(scrollYProgress, [0, 1], [70, -90]);
  const frontY = useTransform(scrollYProgress, [0, 1], [100, -130]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.03, 1.12]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, { stiffness: 45, damping: 25 });
  const y = useSpring(mouseY, { stiffness: 45, damping: 25 });
  return <section ref={ref} className={`story-scene ${final ? "story-final" : "story-hero"}`} onPointerMove={(event) => {
    if (reduced || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX / bounds.width - 0.5) * 18);
    mouseY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 12);
  }} onPointerLeave={() => { mouseX.set(0); mouseY.set(0); }}>
    <motion.div className="story-layer story-background" style={reduced ? {} : { y: backgroundY, scale }}><img src={final ? bouquet : atelier} alt={final ? "Un buchet de trandafiri roz și flori crem, pregătit de livrare" : "Atelier de flori ilustrat, în lumina caldă a apusului"} width={1920} height={1088} loading={final ? "lazy" : "eager"} /></motion.div>
    {!final && <motion.div className="story-layer story-mid" style={reduced ? {} : { y: middleY }}><motion.img src={workbench} alt="" width={1920} height={1088} style={reduced ? {} : { x, y }} /></motion.div>}
    <div className="story-shade" />
    <motion.div className="story-layer story-front" style={reduced ? {} : { y: frontY }}><img src={foreground} alt="" width={1920} height={1088} loading="lazy" /></motion.div>
    <div className="story-petals" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i className={`story-petal petal-${i}`} key={i} />)}</div>
    {children}
  </section>;
}

function AboutApp() {
  const reduced = useStoryReducedMotion();
  const screens = [
    { title: "Inbox", Icon: Inbox, to: "/inbox" as const },
    { title: "Comenzi", Icon: ClipboardList, to: "/comenzi" as const },
    { title: "Stoc", Icon: Sprout, to: "/stoc" as const },
    { title: "Setări", Icon: Settings2, to: "/setari" as const },
  ];
  return <section className="story-section story-chaos story-graphic-section"><div className="story-section-heading"><span className="story-chapter">01 / FLORAAI</span><StoryTitle>Totul înflorește împreună.</StoryTitle></div><div className="story-orbit"><div className="story-orbit-ring" aria-hidden="true" /><div className="story-brand-flower"><Flower2 strokeWidth={0.8} /><span>FloraAI</span></div>{screens.map(({ title, Icon, to }, i) => <motion.div className={`story-orbit-item story-orbit-item-${i}`} key={title} initial={reduced ? false : { opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : i * 0.12 }}><Button asChild variant="ghost" className="story-orbit-link"><Link to={to}><Icon strokeWidth={1.2} /><span>{title}</span><ArrowRight size={16} /></Link></Button></motion.div>)}</div><div className="story-quiet-accents" aria-hidden="true" /></section>;
}

function AppScreens() {
  const reduced = useStoryReducedMotion();
  return <section className="story-section story-numbers story-graphic-section"><div className="story-section-heading"><span className="story-chapter">02 / COMENZI</span><StoryTitle>Fiecare comandă, în armonie.</StoryTitle></div><motion.div className="story-order-art" initial={reduced ? false : { opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 0.7 }}><div className="story-paper-back" aria-hidden="true" /><div className="story-order-paper"><span className="story-paper-brand"><Flower2 size={20} /> FloraAI</span><Flower2 className="story-paper-bloom" strokeWidth={0.7} /><h3>Un buchet de bucurie.</h3><div className="story-paper-rule" /><span className="story-paper-status"><Check size={17} /> Confirmată</span></div><div className="story-floating-note story-note-message"><Inbox /><span>Mesaj primit</span><Check size={16} /></div><div className="story-floating-note story-note-date"><CalendarDays /><span>Livrare</span><Heart size={16} /></div></motion.div><div className="story-quiet-accents" aria-hidden="true" /></section>;
}

function AppPreview() {
  const reduced = useStoryReducedMotion();
  return <section className="story-section story-flow story-graphic-section"><div className="story-section-heading"><span className="story-chapter">03 / ATELIERUL TĂU</span><StoryTitle>Un atelier în echilibru.</StoryTitle></div><div className="story-garden" aria-label="Ilustrație a florilor și stocului organizat"><div className="story-garden-line" aria-hidden="true" />{[{ name: "Trandafiri", level: "full" }, { name: "Lalele", level: "medium" }, { name: "Eustoma", level: "high" }].map(({ name, level }, i) => <motion.div className={`story-garden-stem story-garden-${i}`} key={name} initial={reduced ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : i * 0.15 }}><div className="story-botanical"><Flower2 strokeWidth={0.8} /><span /><Sprout strokeWidth={1} /></div><span className="story-garden-name">{name}</span><div className="story-garden-meter" aria-hidden="true"><i className={`story-meter-${level}`} /></div></motion.div>)}</div><EnterAtelier /><div className="story-quiet-accents" aria-hidden="true" /></section>;
}

export function PresentationPage() {
  return <MotionConfig reducedMotion="user"><main className="florio-story"><IllustratedSection><header className="story-header"><span><Flower2 strokeWidth={1.2} /> FloraAI</span><Button asChild variant="ghost" className="story-header-link"><Link to="/inbox">Intră în atelier <ArrowRight /></Link></Button></header><div className="story-hero-content"><StoryTitle hero>FloraAI</StoryTitle><p>Un pic de ordine.<br />Un buchet de liniște.</p><EnterAtelier /></div><a href="#floraai" className="story-scroll" aria-label="Descoperă FloraAI"><ArrowDown /></a><span className="story-hero-footnote">Mai mult timp pentru flori.</span></IllustratedSection><div id="floraai"><AboutApp /></div><AppScreens /><AppPreview /><IllustratedSection final><div className="story-final-content"><StoryTitle>Mai mult timp pentru flori.</StoryTitle><EnterAtelier /></div><footer className="story-footer"><span>FloraAI</span><Flower2 /></footer></IllustratedSection></main></MotionConfig>;
}