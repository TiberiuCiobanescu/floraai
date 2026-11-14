import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion, MotionConfig, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Flower2, Inbox, ClipboardList, Sprout, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import atelier from "@/assets/story-atelier.jpg";
import workbench from "@/assets/story-workbench.png";
import foreground from "@/assets/story-foreground.png";
import bouquet from "@/assets/story-bouquet.jpg";
import inboxPreview from "@/assets/floraai-inbox.png.asset.json";

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
  return <section className="story-section story-chaos"><div className="story-section-heading"><span className="story-chapter">01 / FLORAAI</span><StoryTitle>Atelierul tău, într-un singur loc.</StoryTitle><p>FloraAI este asistentul de organizare al florăriei tale.</p></div><motion.p className="story-app-intro" initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 0.4 }}>Mesajele clienților, detaliile comenzilor și florile din stoc se întâlnesc în același atelier. Tu păstrezi controlul asupra fiecărei comenzi.</motion.p><EnterAtelier /><img className="story-corner-flowers" src={foreground} alt="" width={1920} height={1088} loading="lazy" /></section>;
}

function AppScreens() {
  const reduced = useStoryReducedMotion();
  const screens = [
    { title: "Inbox", description: "Mesajele clienților, grupate după status, canal și tip.", Icon: Inbox, to: "/inbox" as const },
    { title: "Comenzi", description: "Produse, livrare, destinatar și status pentru fiecare comandă.", Icon: ClipboardList, to: "/comenzi" as const },
    { title: "Stoc", description: "Cantitățile de flori și alertele pentru stoc redus.", Icon: Sprout, to: "/stoc" as const },
    { title: "Setări", description: "Termenele de modificare și pragurile de stoc ale atelierului.", Icon: Settings2, to: "/setari" as const },
  ];
  return <section className="story-section story-numbers"><div className="story-section-heading"><span className="story-chapter">02 / ATELIERUL TĂU</span><StoryTitle>Tot ce ai de organizat.</StoryTitle></div><div className="story-app-screens">{screens.map(({ title, description, Icon, to }, i) => <motion.div key={title} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : i * 0.05 }}><Icon size={30} /><h3>{title}</h3><p>{description}</p><Button asChild variant="ghost" className="story-header-link"><Link to={to}>Deschide {title} <ArrowRight size={16} /></Link></Button></motion.div>)}</div><img className="story-corner-flowers" src={foreground} alt="" width={1920} height={1088} loading="lazy" /></section>;
}

function AppPreview() {
  const reduced = useStoryReducedMotion();
  return <section className="story-section story-flow"><div className="story-section-heading"><span className="story-chapter">03 / ÎN APLICAȚIE</span><StoryTitle>Un loc pentru fiecare detaliu.</StoryTitle><p>Acesta este Inboxul FloraAI, cu datele demonstrative ale atelierului.</p></div><motion.img className="story-app-preview" src={inboxPreview.url} alt="Inboxul FloraAI: mesaje, filtre și statusurile clienților" loading="lazy" initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 0.4 }} /><EnterAtelier /><img className="story-corner-flowers" src={workbench} alt="" width={1920} height={1088} loading="lazy" /></section>;
}

export function PresentationPage() {
  return <MotionConfig reducedMotion="user"><main className="florio-story"><IllustratedSection><header className="story-header"><span><Flower2 strokeWidth={1.2} /> FloraAI</span><Button asChild variant="ghost" className="story-header-link"><Link to="/inbox">Intră în atelier <ArrowRight /></Link></Button></header><div className="story-hero-content"><StoryTitle hero>FloraAI</StoryTitle><p>Un pic de ordine.<br />Un buchet de liniște.</p><EnterAtelier /></div><a href="#floraai" className="story-scroll" aria-label="Descoperă FloraAI"><ArrowDown /></a><span className="story-hero-footnote">Mai mult timp pentru flori.</span></IllustratedSection><div id="floraai"><AboutApp /></div><AppScreens /><AppPreview /><IllustratedSection final><div className="story-final-content"><StoryTitle>Mai mult timp pentru flori.</StoryTitle><EnterAtelier /></div><footer className="story-footer"><span>FloraAI</span><Flower2 /></footer></IllustratedSection></main></MotionConfig>;
}