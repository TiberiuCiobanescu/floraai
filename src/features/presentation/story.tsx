import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { animate, motion, MotionConfig, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowDown, ArrowRight, Check, Flower2, MessageCircle, Phone, StickyNote, Sparkles, ShieldCheck, UserRound, CircleCheck } from "lucide-react";
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
    {!final && <div className="story-petals" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <motion.i className={`story-petal petal-${i}`} key={i} initial={false} animate={reduced ? {} : { y: [0, -70, 0], x: [0, 25, -10, 0], rotate: [0, 65, -20, 0] }} transition={{ duration: 9 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }} />)}</div>}
    {children}
  </section>;
}

function FlyingMessage({ index, progress, reduced }: { index: number; progress: MotionValue<number>; reduced: boolean }) {
  const positions = [[-340, -115, -12], [325, -70, 10], [-260, 120, 9], [300, 145, -8]];
  const [startX = 0, startY = 0, angle = 0] = positions[index] ?? [0, 0, 0];
  const x = useTransform(progress, [0.12, 0.65], [startX, 0]);
  const y = useTransform(progress, [0.12, 0.65], [startY, 0]);
  const rotate = useTransform(progress, [0.12, 0.65], [angle, 0]);
  const opacity = useTransform(progress, [0.3, 0.44], [1, 0]);
  const Icon = [MessageCircle, Phone, StickyNote, MessageCircle][index] ?? MessageCircle;
  return <motion.div className={`story-message story-message-${index}`} style={reduced ? {} : { x, y, rotate, opacity }}><Icon size={21} /><div><small>{["WhatsApp", "Telefon", "Bilețel", "WhatsApp"][index]}</small><p>{["Un buchet pentru mâine…", "La ce oră îl puteți livra?", "Să nu uităm bilețelul!", "Adresa este…"][index]}</p></div></motion.div>;
}

function Chaos() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useStoryReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.42, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.42, 0.5], [0.85, 1]);
  return <section ref={ref} className="story-section story-chaos"><div className="story-section-heading"><span className="story-chapter">01 / HAOSUL</span><StoryTitle>Haosul</StoryTitle><p>Comenzile vin de peste tot. Unele se pierd.</p></div><div className="story-message-stage">{[0, 1, 2, 3].map((index) => <FlyingMessage key={index} index={index} progress={scrollYProgress} reduced={reduced} />)}<motion.div className="story-order" style={reduced ? {} : { opacity, scale }}><div className="story-order-heading"><Flower2 /><span>Comandă</span><CircleCheck /></div><p>Buchet de flori</p><div><span>Livrare</span><strong>Mâine</strong></div><div><span>Adresă</span><Check size={18} /></div><div><span>Bilețel</span><Check size={18} /></div></motion.div></div><img className="story-corner-flowers" src={foreground} alt="" width={1920} height={1088} loading="lazy" /></section>;
}

function CountingNumber({ from, to, decimals = 0, suffix = "" }: { from?: number; to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useStoryReducedMotion();
  const [fraction, setFraction] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const control = animate(0, 1, { duration: 1.25, ease: "easeOut", onUpdate: setFraction });
    return () => control.stop();
  }, [inView, reduced]);
  const format = (n: number) => (n * (reduced ? 1 : fraction)).toFixed(decimals).replace(/\.0$/, "").replace(".", ",");
  return <span ref={ref}>{from === undefined ? "" : `${format(from)}–`}{format(to)}{suffix}</span>;
}

function Numbers() {
  return <section className="story-section story-numbers"><div className="story-section-heading"><span className="story-chapter">02 / CIFRELE</span><StoryTitle>Cifrele</StoryTitle></div><div className="story-statistics"><div><strong><CountingNumber from={35} to={40} /></strong><p>comenzi pe zi</p></div><div><strong><CountingNumber from={1.5} to={3} decimals={1} /></strong><p>ore pe zi pierdute cu transcrierea</p></div><div><strong><CountingNumber from={2} to={5} suffix="%" /></strong><p>comenzi greșite</p></div><div><strong><CountingNumber to={300} suffix=" lei" /></strong><p>costul unui bilețel greșit</p></div></div><small className="story-source">Din interviuri cu 3 florării</small><img className="story-corner-flowers" src={foreground} alt="" width={1920} height={1088} loading="lazy" /></section>;
}

function OrderFlow() {
  const reduced = useStoryReducedMotion();
  const steps = [{ text: "Mesaj", Icon: MessageCircle }, { text: "AI înțelege", Icon: Sparkles }, { text: "Reguli verifică", detail: "stoc, termen, client", Icon: ShieldCheck }, { text: "Florarul aprobă", Icon: UserRound }, { text: "Clientul confirmă", Icon: CircleCheck }];
  return <section className="story-section story-flow"><div className="story-section-heading"><span className="story-chapter">03 / ORDINEA</span><StoryTitle>Ordinea</StoryTitle></div><div className="story-steps">{steps.map(({ text, detail, Icon }, i) => <motion.div key={text} className="story-step" initial={reduced ? false : { opacity: 0, y: 30 }} animate={reduced ? { opacity: 1, y: 0 } : {}} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.7 }} transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : i * 0.14 }}><span className="story-step-number">0{i + 1}</span><Icon className="story-step-icon" /><h3>{text}</h3>{detail && <p>({detail})</p>}{i < 4 && <ArrowRight className="story-step-arrow" />}</motion.div>)}</div><img className="story-corner-flowers" src={workbench} alt="" width={1920} height={1088} loading="lazy" /></section>;
}

export function PresentationPage() {
  return <MotionConfig reducedMotion="user"><main className="florio-story"><IllustratedSection><header className="story-header"><span><Flower2 strokeWidth={1.2} /> FloraAI</span><Button asChild variant="ghost" className="story-header-link"><Link to="/inbox">Intră în atelier <ArrowRight /></Link></Button></header><div className="story-hero-content"><StoryTitle hero>FloraAI</StoryTitle><p>Un pic de ordine.<br />Un buchet de liniște.</p><EnterAtelier /></div><a href="#haosul" className="story-scroll" aria-label="Continuă la Haosul"><ArrowDown /></a><span className="story-hero-footnote">Mai mult timp pentru flori.</span></IllustratedSection><div id="haosul"><Chaos /></div><Numbers /><OrderFlow /><IllustratedSection final><div className="story-final-content"><StoryTitle>Mai mult timp pentru flori.</StoryTitle><EnterAtelier /></div><footer className="story-footer"><span>FloraAI</span><Flower2 /></footer></IllustratedSection></main></MotionConfig>;
}