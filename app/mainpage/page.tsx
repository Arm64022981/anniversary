"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- ตั้งค่าข้อมูลไฟล์จากเครื่องคุณ ---
const MUSIC_SRC = "/THAISUB All I Ever Need - Austin Mahone.mp3"; 
const VIDEO_SRC = "/1111.mp4"; // วิดีโอบนสุด
const COUPLE_NAME = "[FoamyFome]";
const MY_NAME = "[Arm Parin]";
const ANNIVERSARY_DATE = "24 February — 24 March 2026";

const PHOTOS = [
  {
    caption: "This clip is so cute, it really made me smile the whole time 🌸", 
    rotate: "-2deg",
  },
  {
    src: "/2222.jpg", // รูปซ้ายล่าง
    caption: "I’ll work out and get stronger so I can protect you 💪💖 ",
    rotate: "1.5deg",
  },
  {
    src: "/3333.jpg", // รูปขวาล่าง
    caption: "Our first trip together 🎀 I was really nervous at first, but I loved it and was so happy 💖",
    rotate: "-1deg",
  },
];

// --- Interfaces & Helpers ---
interface Petal { id: number; left: number; delay: number; dur: number; size: number; rot: number; swing: number; color: string; }
interface HeartItem { id: number; x: number; y: number; }
interface Particle { x: number; y: number; vx: number; vy: number; alpha: number; color: string; radius: number; decay: number; }
interface FwRocket { x: number; y: number; tx: number; ty: number; vx: number; vy: number; alpha: number; color: string; trail: {x:number;y:number}[]; }

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export default function AnniversaryPage() {
  const [petals, setPetals] = useState<Petal[]>([]);
  const [hearts, setHearts] = useState<HeartItem[]>([]);
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [showFireworks, setShowFireworks] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fwRef = useRef<{ rockets: FwRocket[]; particles: Particle[]; raf: number }>({ rockets: [], particles: [], raf: 0 });

  const COLORS = ['#ff80ab','#f48fb1','#ffb3c6','#ff4081','#ffd6e0','#fff176','#ffe57f','#ff6e6e','#b388ff','#80d8ff'];

  // --- Fireworks Logic ---
  const explode = useCallback((x: number, y: number, color: string, particles: Particle[]) => {
    const count = 80;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        alpha: 1, color, radius: 1.5 + Math.random() * 2, decay: 0.015
      });
    }
  }, []);

  const launchRocket = useCallback((canvas: HTMLCanvasElement, rockets: FwRocket[]) => {
    const x = canvas.width * (0.2 + Math.random() * 0.6);
    const ty = canvas.height * (0.1 + Math.random() * 0.3);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    rockets.push({ x: canvas.width/2, y: canvas.height, tx: x, ty, vx: (x - canvas.width/2)/40, vy: (ty - canvas.height)/40, alpha: 1, color, trail: [] });
  }, [COLORS]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let launchCount = 0;
    const state = fwRef.current;
    const tick = () => {
      ctx.fillStyle = 'rgba(255,245,248,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (launchCount < 15 && Math.random() < 0.05) { launchRocket(canvas, state.rockets); launchCount++; }
      
      state.rockets = state.rockets.filter(r => {
        r.x += r.vx; r.y += r.vy; r.vy += 0.05;
        ctx.fillStyle = r.color; ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, Math.PI*2); ctx.fill();
        if (r.y <= r.ty || r.vy >= 0) { explode(r.x, r.y, r.color, state.particles); return false; }
        return true;
      });

      state.particles = state.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.alpha -= p.decay;
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        return p.alpha > 0;
      });

      if (launchCount >= 15 && state.rockets.length === 0 && state.particles.length === 0) {
        setShowFireworks(false); return;
      }
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(state.raf);
  }, [explode, launchRocket]);

  useEffect(() => {
    const rand = seededRand(99);
    setPetals(Array.from({ length: 20 }, (_, i) => ({
      id: i, left: rand() * 100, delay: rand() * 10, dur: 10 + rand() * 5,
      size: 10 + rand() * 10, rot: rand() * 360, swing: Math.round(rand() * 40 - 20),
      color: ['#ffb3c6','#ffd6e0','#ffc8dd','#ffafcc'][i % 4]
    })));
  }, []);

  const handleInteraction = (e: React.MouseEvent) => {
    if (!isMusicPlaying && audioRef.current) {
      audioRef.current.play().catch((err) => console.log("Playback error:", err));
      setIsMusicPlaying(true);
    }
    const t = e.target as Element;
    if (t.closest('button') || t.closest('[data-photo]') || t.tagName === 'VIDEO') return;
    const id = Date.now();
    setHearts(h => [...h, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setHearts(h => h.filter(v => v.id !== id)), 1200);
  };

  const p = {
    pink: '#d63384',
    softBg: 'linear-gradient(160deg,#fff5f8 0%,#fce4ec 50%,#fdf0f5 100%)',
    card: 'rgba(255,255,255,0.82)',
    text: '#5c3347',
  };

  return (
    <div 
      onClick={handleInteraction}
      style={{ minHeight: '100vh', background: p.softBg, fontFamily: "'Georgia', serif", position: 'relative', overflowX: 'hidden', cursor: 'pointer' }}
    >
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" />

      {showFireworks && <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none' }} />}

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {petals.map(pt => (
          <div key={pt.id} style={{ position: 'absolute', left: `${pt.left}%`, top: '-20px', width: pt.size, height: pt.size, animation: `fall ${pt.dur}s ${pt.delay}s linear infinite`, ...({'--sw': `${pt.swing}px`} as any) }}>
            <div style={{ width: '100%', height: '100%', background: pt.color, borderRadius: '50% 10%', transform: `rotate(${pt.rot}deg)`, opacity: 0.6 }} />
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000 }}>
        {hearts.map(h => (
          <div key={h.id} style={{ position: 'fixed', left: h.x, top: h.y, fontSize: 24, animation: 'pop 1.2s forwards', transform: 'translate(-50%,-50%)' }}>🩷</div>
        ))}
      </div>

      {activePhoto !== null && activePhoto !== 0 && (
        <div onClick={() => setActivePhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={PHOTOS[activePhoto].src} style={{ maxWidth: '90%', maxHeight: '80%', borderRadius: 15, border: '5px solid white', animation: 'zoom 0.3s' }} />
        </div>
      )}

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 10 }}>
        
        <header style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.3em', color: '#b07090', textTransform: 'uppercase' }}>{ANNIVERSARY_DATE}</p>
          <h1 style={{ fontSize: 'clamp(32px, 10vw, 54px)', color: p.pink, margin: '15px 0' }}>Happy 1st Month</h1>
          <div style={{ fontSize: 24, animation: 'bounce 2s infinite' }}>✨ 🎀 ✨</div>
          {!isMusicPlaying && <p style={{ fontSize: 12, color: p.pink, marginTop: 10, opacity: 0.7 }}>(แตะตรงไหนก็ได้เพื่อเปิดเพลงนะ)</p>}
        </header>

        <section style={{ background: p.card, backdropFilter: 'blur(10px)', borderRadius: 30, padding: 40, border: '1px solid rgba(214,51,132,0.1)', boxShadow: '0 15px 45px rgba(214,51,132,0.1)', marginBottom: 40 }}>
          <p style={{ color: p.pink, fontWeight: 'bold', marginBottom: 20 }}>to {COUPLE_NAME},</p>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: p.text, fontStyle: 'italic' }}>
            Foam, I can’t believe it’s already been a month—being with you makes me happy every day, and I hope we stay like this for a long time 🌸
          </p>
        </section>

        {/* Video Section (1111.mp4) - แก้ไขให้เห็นเต็มจอ + เอฟเฟกต์ Glassmorphism */}
        <div style={{ marginBottom: 40, animation: 'fadeUp 0.7s ease 0.25s both' }}>
          <div style={{ 
            borderRadius: 30, // เพิ่มความมนอีกนิด
            overflow: 'hidden', 
            border: '4px solid white', 
            boxShadow: '0 20px 60px rgba(214,51,132,0.2)', // เงาชมพูที่ดูละมุนขึ้น
            transform: `rotate(${PHOTOS[0].rotate})`,
            /* ปรับAspectRatio ให้พอดีกับวิดีโอ: ถ้าวิดีโอเป็นแนวตั้ง (TikTok/Reels) ควรแก้เป็น '9/16' */
            aspectRatio: '16/9', 
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative' // เพิ่ม position: relative สำหรับ overlay
          }}>
            {/* --- ส่วนที่เพิ่ม: เอฟเฟกต์กระจกฝ้าซ้อนหลัง --- */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,182,193,0.3) 0%, rgba(255,255,255,0.4) 100%)', // gradient ชมพูขาว
              backdropFilter: 'blur(15px)', // เบลอหลังเพื่อให้ดูเหมือนกระจกฝ้า
              zIndex: 1 // วางไว้ใต้ video แต่เหนือ background ดำ
            }} />

            <video 
              src={VIDEO_SRC}
              autoPlay 
              loop 
              muted 
              playsInline 
              style={{ 
                width: '100%', 
                height: '100%', 
                /*contain เพื่อให้เห็นครบทุกส่วนของคลิป */
                objectFit: 'contain', 
                display: 'block',
                position: 'relative', // เพื่อให้ video อยู่เหนือ layer เบลอ
                zIndex: 2 // วางvideo ไว้บนสุด
              }}
            />
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#b07090', fontStyle: 'italic', marginTop: 12 }}>{PHOTOS[0].caption}</p>
        </div>

        {/* Photos Grid (2222.jpg และ 3333.jpg) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40, animation: 'fadeUp 0.7s ease 0.45s both' }}>
          {PHOTOS.slice(1).map((ph, i) => (
            <div key={i} data-photo onClick={() => setActivePhoto(i+1)} style={{ cursor: 'zoom-in' }}>
              <div style={{ borderRadius: 15, overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', transform: `rotate(${ph.rotate})`, aspectRatio: '4/5' }}>
                <img src={ph.src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#b07090', fontStyle: 'italic', marginTop: 10 }}>{ph.caption}</p>
            </div>
          ))}
        </div>

        <section style={{ background: 'linear-gradient(135deg, #fff, #ffeef5)', borderRadius: 30, padding: 40, textAlign: 'center', border: '1px solid rgba(214,51,132,0.2)' }}>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: p.text, fontStyle: 'italic', marginBottom: 30 }}>
            "Thanks for making these 30 days so special—I’m really happy to have you 💖 <br/> Let’s go find lots of delicious food and travel together more often 💖"
          </p>
          <div style={{ height: 1, background: '#f06292', width: 60, margin: '0 auto 20px', opacity: 0.3 }} />
          <p style={{ fontSize: 22, color: p.pink, fontWeight: 'bold' }}>love Foam the most 💖💕</p>
          <p style={{ fontSize: 14, color: '#b07090', marginTop: 10 }}>— From {MY_NAME}</p>
        </section>

      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-50px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(110vh) translateX(var(--sw)) rotate(360deg); opacity: 0; }
        }
        @keyframes pop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -200%) scale(2); opacity: 0; }
        }
        @keyframes zoom {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}