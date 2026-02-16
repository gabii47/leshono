/* global React */

const { useCallback, useEffect, useMemo, useRef, useState } = React;

(function ensureStorage() {
  if (typeof window === "undefined") return;
  if (window.storage && window.storage.get && window.storage.set && window.storage.remove) return;

  const prefix = "leshono:";
  window.storage = {
    async get(key) {
      try {
        const raw = window.localStorage.getItem(prefix + key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    async set(key, val) {
      try {
        window.localStorage.setItem(prefix + key, JSON.stringify(val));
      } catch {}
      return true;
    },
    async remove(key) {
      try {
        window.localStorage.removeItem(prefix + key);
      } catch {}
      return true;
    },
  };
})();

function useGlobalStyle() {
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-leshono", "1");
    el.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Questrial&family=Raleway:wght@400;600;800&family=Noto+Sans+Syriac:wght@400;700&display=swap');
@font-face{font-family:'SertoAntiochBible';src:url('https://cdn.jsdelivr.net/gh/nicosyres/Serto-Fonts@master/SyrCOMAntioch.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap;}
@keyframes correctPulse{0%{transform:scale(1)}55%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes slideInRight{0%{transform:translateX(30px);opacity:0}100%{transform:translateX(0);opacity:1}}
@keyframes miniConfetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0.95}}
@keyframes cfall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0.95}}
`;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
}

const UI_FONT = "'Questrial','Raleway',-apple-system,'SF Pro Display',system-ui,sans-serif";
const SYR_FONT = "'SertoAntiochBible','Noto Sans Syriac',serif";

const COLORS = {
  bgLight: "#fff",
  bgDark: "#1a1a2e",
  fgLight: "#333",
  fgDark: "#e0e0e0",
  cardLight: "#f7f7f7",
  cardDark: "#16213e",
  accent: "#58cc02",
  accentShadow: "#46a302",
  error: "#ff4b4b",
  streak: "#ff9600",
  info: "#1cb0f6",
  beginner: "#58cc02",
  intermediate: "#ce82ff",
  advanced: "#f19e38",
  dialogueLight: "#e3f2fd",
  dialogueDark: "#0d2847",
  grammarLight: "#fff3e0",
  grammarDark: "#3e2723",
  cultureLight: "#f3e5f5",
  cultureDark: "#1a0a2e",
};

const LANGS = [
  { id: "en", label: "EN", flag: "🇬🇧" },
  { id: "de", label: "DE", flag: "🇩🇪" },
  { id: "sv", label: "SV", flag: "🇸🇪" },
  { id: "nl", label: "NL", flag: "🇳🇱" },
  { id: "tr", label: "TR", flag: "🇹🇷" },
];

function looksSyriac(text) {
  if (!text) return false;
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    if (c >= 0x0700 && c <= 0x074f) return true;
  }
  return false;
}

function Syriac({ children, style }) {
  const t = String(children ?? "");
  const isSy = looksSyriac(t);
  return (
    <span
      style={{
        ...(isSy
          ? {
              direction: "rtl",
              unicodeBidi: "plaintext",
              fontFamily: SYR_FONT,
              fontSize: "1.3em",
            }
          : {}),
        ...style,
      }}
    >
      {t}
    </span>
  );
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tryHaptic(kind) {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate(kind === "success" ? [18, 12, 18] : [30]);
  } catch {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i >= 1; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function normalizeLatinAnswer(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("š", "sh")
    .replaceAll("ṣ", "s")
    .replaceAll("ṭ", "t")
    .replaceAll("ḏ", "d")
    .replaceAll("ḥ", "h")
    .replaceAll("ġ", "g")
    .replaceAll("ʿ", "")
    .replaceAll("’", "")
    .replaceAll("'", "")
    .replace(/\s+/g, " ");
}

function answerMatch(input, expected, alts) {
  const a = normalizeLatinAnswer(input);
  const e = normalizeLatinAnswer(expected);
  if (a === e) return true;
  if (Array.isArray(alts)) {
    for (const alt of alts) if (normalizeLatinAnswer(alt) === a) return true;
  }
  return false;
}

function btn3d(shadowHex, { pressY = 3, up = 4, down = 1 } = {}) {
  const upShadow = `0 ${up}px 0 ${shadowHex}`;
  const downShadow = `0 ${down}px 0 ${shadowHex}`;

  const baseStyle = {
    boxShadow: upShadow,
    transition: "transform 0.1s, box-shadow 0.1s",
    transform: "translateY(0px)",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    touchAction: "manipulation",
  };

  const handlers = {
    onMouseDown: (e) => {
      e.currentTarget.style.transform = `translateY(${pressY}px)`;
      e.currentTarget.style.boxShadow = downShadow;
    },
    onMouseUp: (e) => {
      e.currentTarget.style.transform = "translateY(0px)";
      e.currentTarget.style.boxShadow = upShadow;
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.transform = "translateY(0px)";
      e.currentTarget.style.boxShadow = upShadow;
    },
    onTouchStart: (e) => {
      e.currentTarget.style.transform = `translateY(${pressY}px)`;
      e.currentTarget.style.boxShadow = downShadow;
    },
    onTouchEnd: (e) => {
      e.currentTarget.style.transform = "translateY(0px)";
      e.currentTarget.style.boxShadow = upShadow;
    },
    onTouchCancel: (e) => {
      e.currentTarget.style.transform = "translateY(0px)";
      e.currentTarget.style.boxShadow = upShadow;
    },
  };

  return { style: baseStyle, ...handlers };
}

function Pill({ children, bg, fg }) {
  return (
    <div style={{ padding: "6px 10px", borderRadius: 999, background: bg, color: fg, fontWeight: 900, fontSize: 12 }}>
      {children}
    </div>
  );
}

function Card({ dark, children, style }) {
  return (
    <div
      style={{
        background: dark ? COLORS.cardDark : COLORS.cardLight,
        borderRadius: 20,
        padding: 14,
        border: "1px solid rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Confetti({ count = 24, accent = COLORS.accent, anim = "miniConfetti", seedKey }) {
  const parts = useMemo(() => {
    const colors = [accent, COLORS.info, COLORS.intermediate, COLORS.advanced, COLORS.streak];
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push({
        left: Math.random() * 100,
        delay: Math.random() * 0.15,
        dur: 1 + Math.random() * 1.5,
        size: 6 + Math.random() * 8,
        color: colors[i % colors.length],
      });
    }
    return out;
  }, [count, accent, seedKey]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 80 }}>
      {parts.map((p, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            top: 0,
            left: `${p.left}vw`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            borderRadius: 3,
            opacity: 0.95,
            animation: `${anim} ${p.dur}s linear ${p.delay}s 1 both`,
          }}
        />
      ))}
    </div>
  );
}

function CornerDecor({ pos = "tl", dark }) {
  const c = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const style = {
    position: "absolute",
    width: 90,
    height: 90,
    opacity: 0.9,
    ...(pos === "tl" ? { top: 12, left: 12 } : {}),
    ...(pos === "tr" ? { top: 12, right: 12 } : {}),
    ...(pos === "bl" ? { bottom: 12, left: 12 } : {}),
    ...(pos === "br" ? { bottom: 12, right: 12 } : {}),
  };
  return (
    <svg viewBox="0 0 100 100" style={style} aria-hidden="true">
      <path d="M10 70 Q40 10 70 30 Q85 40 90 60 Q60 90 10 70Z" fill={c} />
      <path d="M28 62 Q50 38 72 52" stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="58" cy="48" r="4" fill={c} />
    </svg>
  );
}

function IconBtn({ icon, active, onClick, dark }) {
  const t = btn3d(dark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.14)", { up: 3, down: 1, pressY: 2 });
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      {...t}
      style={{
        ...t.style,
        width: 54,
        height: 44,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(88,204,2,0.18)" : dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)",
        border: `1px solid ${active ? "rgba(88,204,2,0.35)" : "rgba(0,0,0,0.08)"}`,
        color: active ? COLORS.accent : dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
        fontWeight: 900,
      }}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      {icon}
    </div>
  );
}

// Minimal course structure (37 units total), lessons are placeholders.
// This is the shell; you can wire in your real database later.
const C = {
  beginner: {
    title: "Beginner",
    syriac: "ܡܫܪܝܐ",
    color: COLORS.beginner,
    units: [
      { id: "u1", title: "Alphabet I & II", syriac: "ܐܳܠܰܦܒܶܝܬ̣", desc: "Scripts + first letters", lessons: ["u1l1", "u1l2"] },
      { id: "u2", title: "Alphabet Vocab", syriac: "ܠܘܚܐ ܕܡܶܠܶܐ", desc: "Core words to start", lessons: ["u2l1"] },
      { id: "u3", title: "Shlomo (Greetings)", syriac: "ܫܠܳܡܳܐ", desc: "Meet & greet", lessons: ["u3l1"] },
      { id: "u4", title: "Iqarto (Family)", syriac: "ܥܩܰܪܬܳܐ", desc: "Family basics", lessons: ["u4l1"] },
      { id: "u5", title: "Madrashto (School)", syriac: "ܡܰܕܪܰܫܬܳܐ", desc: "Classroom words", lessons: ["u5l1"] },
      { id: "u6", title: "U bayto (House)", syriac: "ܘ ܒܰܝܬܐ", desc: "Rooms + objects", lessons: ["u6l1"] },
      { id: "u7", title: "U gushmo (Body)", syriac: "ܘ ܓܘܫܡܐ", desc: "Body parts", lessons: ["u7l1"] },
      { id: "u8", title: "Zabno (Numbers)", syriac: "ܙܰܒܢܳܐ", desc: "Count + time", lessons: ["u8l1"] },
      { id: "u9", title: "Surgodo (Calendar)", syriac: "ܣܘܪܓܳܕܳܐ", desc: "Days + months", lessons: ["u9l1"] },
      { id: "u10", title: "Muklo (Food)", syriac: "ܡܘܟܠܳܐ", desc: "Food + ordering", lessons: ["u10l1"] },
      { id: "u11", title: "Jule w Gawne (Clothes)", syriac: "ܓܘܠܶܐ ܘܓܰܘܢܶܐ", desc: "Colors + clothes", lessons: ["u11l1"] },
      { id: "u12", title: "Mazracto (Animals)", syriac: "ܡܰܙܪܰܩܬܳܐ", desc: "Animals", lessons: ["u12l1"] },
      { id: "u13", title: "Holidays", syriac: "ܥܝܕ̈ܐ", desc: "Celebrations", lessons: ["u13l1"] },
      { id: "u14", title: "Su taxtor (Doctor)", syriac: "ܣܘ ܬܰܟܬܳܪ", desc: "Health phrases", lessons: ["u14l1"] },
      { id: "u15", title: "Spor", syriac: "ܣܦܳܪ", desc: "Sports", lessons: ["u15l1"] },
      { id: "u16", title: "Tlobo w Gworo (Wedding)", syriac: "ܛܠܳܒܳܐ ܘܓܘܳܪܳܐ", desc: "Wedding words", lessons: ["u16l1"] },
    ],
  },
  intermediate: {
    title: "Intermediate",
    syriac: "ܡܶܨܥܳܝܐ",
    color: COLORS.intermediate,
    units: [
      { id: "u17", title: "Travel", syriac: "ܫܘܩܳܐ", desc: "Directions + transport", lessons: ["u17l1"] },
      { id: "u18", title: "Weather", syriac: "ܐܰܘܝܪܳܐ", desc: "Forecast + small talk", lessons: ["u18l1"] },
      { id: "u19", title: "Diaspora", syriac: "ܓܳܠܘܬܳܐ", desc: "Identity abroad", lessons: ["u19l1"] },
      { id: "u20", title: "Verb Conjugation", syriac: "ܦܥܳܠ̈ܐ", desc: "Patterns + practice", lessons: ["u20l1"] },
      { id: "u21", title: "University", syriac: "ܝܘܢܝܒܶܪܣܝܛܳܐ", desc: "Campus life", lessons: ["u21l1"] },
      { id: "u22", title: "Driving", syriac: "ܢܗܳܓܳܐ", desc: "Road words", lessons: ["u22l1"] },
      { id: "u23", title: "Leisure", syriac: "ܦܢܳܝܳܐ", desc: "Free time", lessons: ["u23l1"] },
      { id: "u24", title: "Restaurant", syriac: "ܡܛܥܡܳܐ", desc: "Ordering + paying", lessons: ["u24l1"] },
      { id: "u25", title: "Media", syriac: "ܡܶܕܝܳܐ", desc: "News + internet", lessons: ["u25l1"] },
    ],
  },
  advanced: {
    title: "Advanced",
    syriac: "ܥܰܡܝܩܳܐ",
    color: COLORS.advanced,
    units: [
      { id: "u26", title: "Folk tales", syriac: "ܡܶܫܠ̈ܐ", desc: "Reading stories", lessons: ["u26l1"] },
      { id: "u27", title: "Moral tales", syriac: "ܡܘܣܳܪ̈ܐ", desc: "Meanings + morals", lessons: ["u27l1"] },
      { id: "u28", title: "Exile", syriac: "ܓܳܠܘܬܳܐ", desc: "Themes + vocabulary", lessons: ["u28l1"] },
      { id: "u29", title: "Wine", syriac: "ܚܰܡܪܳܐ", desc: "Traditions", lessons: ["u29l1"] },
      { id: "u30", title: "Social Media", syriac: "ܡܶܕܝܳܐ", desc: "Modern life", lessons: ["u30l1"] },
      { id: "u31", title: "Village", syriac: "ܩܰܪܝܬܳܐ", desc: "Village words", lessons: ["u31l1"] },
      { id: "u32", title: "Identity", syriac: "ܗܘܝܘܬܳܐ", desc: "Culture + identity", lessons: ["u32l1"] },
      { id: "u33", title: "Sayfo", syriac: "ܣܰܝܦܳܐ", desc: "History terms", lessons: ["u33l1"] },
      { id: "u34", title: "Arkah", syriac: "ܐܰܪܟܳܗ", desc: "Place & memory", lessons: ["u34l1"] },
      { id: "u35", title: "Monasteries", syriac: "ܕܰܝܪ̈ܐ", desc: "Heritage", lessons: ["u35l1"] },
      { id: "u36", title: "Naum Faik", syriac: "ܢܰܥܘܡ ܦܰܐܝܶܩ", desc: "Figures", lessons: ["u36l1"] },
      { id: "u37", title: "Legal", syriac: "ܢܳܡܘܣ̈ܐ", desc: "Legal vocabulary", lessons: ["u37l1"] },
    ],
  },
};

const LESSONS = {
  u1l1: {
    id: "u1l1",
    title: "Welcome to two scripts",
    xp: 10,
    intro: {
      title: "Two scripts",
      desc: "Turoyo can be written in Syriac script and in Latin transliteration. You’ll learn both.",
      vocab: [
        ["turoyo", "Turoyo", "ܛܘܪܝܳܐ"],
        ["ktobo", "writing", "ܟܬܳܒܳܐ"],
      ],
      dialog: [
        { a: "A", t: "Shlomo!", s: "ܫܠܳܡܳܐ!" },
        { a: "B", t: "Shlomo! Kifo at?", s: "ܫܠܳܡܳܐ! ܟܺܝܦܳܐ ܐܰܬ?" },
      ],
      grammar: "Syriac script is read right-to-left. Latin transliteration is left-to-right.",
      culture: "Pick your preferred language for UI in settings.",
    },
    ex: [
      { type: "truefalse", q: "Syriac script is read right-to-left.", a: true },
      { type: "select", q: "Pick the Turoyo greeting:", options: ["Shlomo", "Hello", "Gracias", "Ciao"], a: "Shlomo", al: ["shlomo"] },
    ],
  },
  u1l2: {
    id: "u1l2",
    title: "Letters: ܐ ܒ ܓ ܕ",
    xp: 15,
    intro: {
      title: "First letters",
      desc: "Match Latin names to Syriac letters.",
      vocab: [
        ["olaf", "A", "ܐ"],
        ["beṯ", "B", "ܒ"],
        ["gomal", "G", "ܓ"],
        ["dolaḏ", "D", "ܕ"],
      ],
    },
    ex: [
      { type: "select", q: "Select ܒ", options: ["ܐ", "ܒ", "ܓ", "ܕ"], a: "ܒ" },
      { type: "match", pairs: [["olaf", "ܐ"], ["beṯ", "ܒ"], ["gomal", "ܓ"], ["dolaḏ", "ܕ"]] },
    ],
  },
  u2l1: {
    id: "u2l1",
    title: "Alphabet words",
    xp: 10,
    intro: {
      title: "Vocabulary",
      vocab: [["bayto", "house", "ܒܰܝܬܐ"], ["mayo", "water", "ܡܰܝܳܐ"]],
    },
    ex: [
      { type: "select", q: 'Choose the word for "house":', options: ["mayo", "bayto", "rabo", "ktobo"], a: "bayto" },
      { type: "type", q: 'Type: "water" (Latin)', a: "mayo", al: ["mayo"] },
    ],
  },
};

function flattenCourse(course) {
  const tiers = ["beginner", "intermediate", "advanced"];
  const flat = [];
  const idx = {};
  for (const tierId of tiers) {
    const tier = course[tierId];
    tier.units.forEach((u) => {
      u.lessons.forEach((lessonId) => {
        const lesson = LESSONS[lessonId] || { id: lessonId, title: "Coming soon", xp: 10, intro: { title: "Coming soon" }, ex: [] };
        const item = { tierId, tier, unit: { ...u, color: tier.color }, lesson };
        idx[lesson.id] = flat.length;
        flat.push(item);
      });
    });
  }
  return { flat, idx };
}

function WelcomePage({ dark, lang, setLang, onGetStarted, onLogin }) {
  const bg = dark ? COLORS.bgDark : COLORS.bgLight;
  const fg = dark ? COLORS.fgDark : COLORS.fgLight;
  const gradient = dark
    ? "linear-gradient(135deg, rgba(88,204,2,0.18), rgba(28,176,246,0.16))"
    : "linear-gradient(135deg, rgba(88,204,2,0.26), rgba(28,176,246,0.18))";

  const tWhite = btn3d("rgba(0,0,0,0.14)");
  const tOutline = btn3d("rgba(0,0,0,0.14)");

  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, fontFamily: UI_FONT, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: gradient }} />
      <CornerDecor pos="tl" dark={dark} />
      <CornerDecor pos="tr" dark={dark} />
      <CornerDecor pos="bl" dark={dark} />
      <CornerDecor pos="br" dark={dark} />

      <div style={{ position: "absolute", top: 26, left: 28, opacity: 0.45, fontWeight: 900 }}>⛪</div>
      <div style={{ position: "absolute", top: 26, right: 28, opacity: 0.45, fontWeight: 900 }}>✝</div>
      <div style={{ position: "absolute", bottom: 26, left: 28, opacity: 0.45, fontWeight: 900 }}>📖</div>
      <div style={{ position: "absolute", bottom: 26, right: 28, opacity: 0.45, fontWeight: 900 }}><Syriac>ܐ</Syriac></div>

      <div style={{ position: "relative", zIndex: 2, padding: 18, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ height: 22 }} />

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🦅</div>
          <div style={{ fontWeight: 900, fontSize: 34, letterSpacing: 0.2 }}>Leshono</div>
          <div style={{ fontWeight: 900, opacity: 0.75, marginTop: 6 }}>Learn Turoyo — one lesson at a time</div>
        </div>

        <div style={{ height: 18 }} />

        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {LANGS.map((l) => {
            const active = lang === l.id;
            const t = btn3d("#d0d0d0");
            return (
              <div
                key={l.id}
                role="button"
                tabIndex={0}
                onClick={() => setLang(l.id)}
                {...t}
                style={{
                  ...t.style,
                  padding: "10px 12px",
                  borderRadius: 18,
                  background: active ? "rgba(88,204,2,0.18)" : dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.85)",
                  border: `2px solid ${active ? COLORS.accent : "rgba(0,0,0,0.12)"}`,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 86,
                  justifyContent: "center",
                }}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ height: 18 }} />

        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          <div role="button" tabIndex={0} onClick={onGetStarted} {...tWhite} style={{
            ...tWhite.style,
            background: "rgba(255,255,255,0.96)",
            color: "#111",
            borderRadius: 18,
            padding: "14px 14px",
            fontWeight: 900,
            textAlign: "center",
            border: "1px solid rgba(0,0,0,0.14)",
          }}>Get Started</div>

          <div role="button" tabIndex={0} onClick={onLogin} {...tOutline} style={{
            ...tOutline.style,
            background: "transparent",
            color: fg,
            borderRadius: 18,
            padding: "14px 14px",
            fontWeight: 900,
            textAlign: "center",
            border: `2px solid ${dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"}`,
            boxShadow: "none",
          }}>Log In</div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function AuthPage({ dark, mode, setMode, onAuthed }) {
  const fg = dark ? COLORS.fgDark : COLORS.fgLight;
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [username, setUsername] = useState("");
  const [err, setErr] = useState("");

  const fieldStyle = {
    width: "100%",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 18,
    padding: "12px 12px",
    outline: "none",
    fontFamily: UI_FONT,
    fontWeight: 800,
    background: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
    color: fg,
  };

  const submit = () => {
    setErr("");
    if (!email.trim() || !pw.trim()) return setErr("Email and password required.");
    if (mode === "signup" && !username.trim()) return setErr("Username required for signup.");
    onAuthed({ email: email.trim(), username: (username.trim() || email.trim().split("@")[0]).slice(0, 16) });
  };

  return (
    <div style={{ padding: 16, paddingBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>{mode === "login" ? "Log In" : "Sign Up"}</div>
        <div style={{ fontWeight: 900, opacity: 0.8 }}>🦅</div>
      </div>

      <Card dark={dark} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={fieldStyle} />
          <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" type="password" style={fieldStyle} />
          {mode === "signup" ? (
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (optional)" style={fieldStyle} />
          ) : null}
          {err ? <div style={{ color: COLORS.error, fontWeight: 900 }}>{err}</div> : null}
          <div role="button" tabIndex={0} onClick={submit} {...btn3d(COLORS.accentShadow)} style={{
            ...btn3d(COLORS.accentShadow).style,
            background: COLORS.accent,
            color: "#0b2a00",
            borderRadius: 18,
            padding: "14px 14px",
            fontWeight: 900,
            textAlign: "center",
            border: "1px solid rgba(0,0,0,0.08)",
            marginTop: 6,
          }}>{mode === "login" ? "Log In" : "Create Account"}</div>
        </div>
      </Card>

      <div role="button" tabIndex={0} onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))} {...btn3d("#d0d0d0")} style={{
        ...btn3d("#d0d0d0").style,
        background: "transparent",
        borderRadius: 18,
        padding: "12px 12px",
        textAlign: "center",
        fontWeight: 900,
        border: `2px solid ${dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"}`,
        boxShadow: "none",
      }}>{mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}</div>
    </div>
  );
}

function Onboarding({ dark, onDone, dailyGoal, setDailyGoal }) {
  const [step, setStep] = useState(0);

  const steps = [
    { title: "Meet Aram the Eagle", body: "Aram will guide you through lessons — short, focused, and repeatable." },
    { title: "How Lessons Work", body: "Each lesson has a Learn intro and Exercises. You choose an answer, then press CHECK." },
    { title: "Hearts & Streaks", body: "Mistakes cost hearts. Keep a streak by practicing often." },
    { title: "Set Your Goal", body: "Choose how many XP you want per day." },
  ];

  const presets = [
    { label: "Casual", goal: 10 },
    { label: "Regular", goal: 20 },
    { label: "Serious", goal: 30 },
    { label: "Intense", goal: 50 },
  ];

  return (
    <div style={{ padding: 16, paddingBottom: 28 }}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Onboarding</div>

      <Card dark={dark} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 42, marginBottom: 8 }}>🦅</div>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>{steps[step].title}</div>
        <div style={{ fontWeight: 900, opacity: 0.75, lineHeight: 1.35 }}>{steps[step].body}</div>

        {step === 3 ? (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {presets.map((p) => {
              const active = dailyGoal === p.goal;
              const t = btn3d("#d0d0d0");
              return (
                <div key={p.goal} role="button" tabIndex={0} onClick={() => setDailyGoal(p.goal)} {...t} style={{
                  ...t.style,
                  padding: 12,
                  borderRadius: 18,
                  background: active ? "rgba(88,204,2,0.18)" : dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
                  border: `2px solid ${active ? COLORS.accent : "rgba(0,0,0,0.12)"}`,
                  fontWeight: 900,
                  textAlign: "center",
                }}>{p.label} • {p.goal} XP</div>
              );
            })}
          </div>
        ) : null}
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <div role="button" tabIndex={0} onClick={() => setStep((s) => Math.max(0, s - 1))} {...btn3d("#d0d0d0")} style={{
          ...btn3d("#d0d0d0").style,
          flex: 1,
          background: "transparent",
          borderRadius: 18,
          padding: "14px 14px",
          fontWeight: 900,
          textAlign: "center",
          border: `2px solid ${dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"}`,
          boxShadow: "none",
          opacity: step === 0 ? 0.5 : 1,
          pointerEvents: step === 0 ? "none" : "auto",
        }}>Back</div>

        <div role="button" tabIndex={0} onClick={() => (step < 3 ? setStep(step + 1) : onDone())} {...btn3d(COLORS.accentShadow)} style={{
          ...btn3d(COLORS.accentShadow).style,
          flex: 1,
          background: COLORS.accent,
          color: "#0b2a00",
          borderRadius: 18,
          padding: "14px 14px",
          fontWeight: 900,
          textAlign: "center",
          border: "1px solid rgba(0,0,0,0.08)",
        }}>{step < 3 ? "Next" : "Finish"}</div>
      </div>
    </div>
  );
}

// Ex/Path/Profile/Goals omitted in this publish MVP for size — next commit will add full pages.
// For now, route to Home placeholder after onboarding.
function HomePlaceholder({ dark }) {
  return (
    <div style={{ padding: 16, paddingBottom: 30 }}>
      <Card dark={dark}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Home (Path View)</div>
        <div style={{ fontWeight: 900, opacity: 0.75, lineHeight: 1.35 }}>
          The React shell is now deployed. Next commit will add the full Path, Lessons, Goals, and Profile pages exactly per spec.
        </div>
      </Card>
    </div>
  );
}

function App() {
  useGlobalStyle();

  const { flat, idx } = useMemo(() => flattenCourse(C), []);

  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");
  const [user, setUser] = useState(null);

  const [page, setPage] = useState("welcome");
  const [authMode, setAuthMode] = useState("login");

  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [done, setDone] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [dailyXp, setDailyXp] = useState(0);
  const [lastDay, setLastDay] = useState(todayKey());

  // load persisted
  useEffect(() => {
    (async () => {
      const s = await window.storage.get("state_react_v1");
      if (!s) return;
      setDark(!!s.dark);
      setLang(s.lang || "en");
      setUser(s.user || null);
      setXp(Number(s.xp || 0));
      setStreak(Number(s.streak || 1));
      setDone(Array.isArray(s.done) ? s.done : []);
      setDailyGoal(Number(s.dailyGoal || 20));
      setDailyXp(Number(s.dailyXp || 0));
      setLastDay(s.lastDay || todayKey());
      setPage(s.page || "welcome");
    })();
  }, []);

  // persist
  useEffect(() => {
    window.storage.set("state_react_v1", { dark, lang, user, xp, streak, done, dailyGoal, dailyXp, lastDay, page });
  }, [dark, lang, user, xp, streak, done, dailyGoal, dailyXp, lastDay, page]);

  // day rollover
  useEffect(() => {
    const tk = todayKey();
    if (lastDay !== tk) {
      setLastDay(tk);
      setDailyXp(0);
    }
  }, [lastDay]);

  const bg = dark ? COLORS.bgDark : COLORS.bgLight;
  const fg = dark ? COLORS.fgDark : COLORS.fgLight;

  const topChrome = page !== "welcome" ? (
    <div style={{ position: "sticky", top: 0, zIndex: 55, background: bg, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>Leshono</div>
        <div role="button" tabIndex={0} onClick={() => setDark((d) => !d)} {...btn3d("#d0d0d0")} style={{
          ...btn3d("#d0d0d0").style,
          padding: "10px 12px",
          borderRadius: 18,
          background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.12)",
          fontWeight: 900,
          minWidth: 52,
          textAlign: "center",
        }}>{dark ? "☾" : "☀︎"}</div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, fontFamily: UI_FONT }}>
      {topChrome}

      {page === "welcome" ? (
        <WelcomePage
          dark={dark}
          lang={lang}
          setLang={setLang}
          onGetStarted={() => setPage("onboarding")}
          onLogin={() => setPage("auth")}
        />
      ) : null}

      {page === "auth" ? (
        <AuthPage
          dark={dark}
          mode={authMode}
          setMode={setAuthMode}
          onAuthed={(u) => {
            setUser(u);
            setPage("onboarding");
          }}
        />
      ) : null}

      {page === "onboarding" ? (
        <Onboarding
          dark={dark}
          dailyGoal={dailyGoal}
          setDailyGoal={setDailyGoal}
          onDone={() => setPage("home")}
        />
      ) : null}

      {page === "home" ? <HomePlaceholder dark={dark} /> : null}
    </div>
  );
}

// export to window so index.html can mount it
window.App = App;
