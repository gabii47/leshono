/* global React */

// Leshono — React single-file app.
// No <form>. Inline styles only. No external UI libs.
// Storage via window.storage async get/set/remove (polyfilled).

const { useCallback, useEffect, useMemo, useRef, useState } = React;

/* ----------------------------- storage polyfill ---------------------------- */
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

/* ------------------------------ style injection ---------------------------- */
function useGlobalStyle() {
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-leshono", "1");
    el.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Questrial&family=Raleway:wght@400;600;800&family=Noto+Sans+Syriac:wght@400;700&display=swap');
@font-face{font-family:'SertoAntiochBible';src:url('https://cdn.jsdelivr.net/gh/nicosyres/Serto-Fonts@master/SyrCOMAntioch.woff2') format('woff2'),url('https://cdn.jsdelivr.net/gh/nicosyres/Serto-Fonts@master/SyrCOMAntioch.woff') format('woff');font-weight:400;font-style:normal;font-display:swap;}
@keyframes correctPulse { 0%{transform:scale(1)} 55%{transform:scale(1.05)} 100%{transform:scale(1)} }
@keyframes slideInRight { 0%{transform:translateX(30px); opacity:0} 100%{transform:translateX(0); opacity:1} }
@keyframes miniConfetti { 0%{transform:translateY(0) rotate(0deg); opacity:1} 100%{transform:translateY(110vh) rotate(720deg); opacity:0.95} }
@keyframes cfall { 0%{transform:translateY(0) rotate(0deg); opacity:1} 100%{transform:translateY(110vh) rotate(720deg); opacity:0.95} }
`;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
}

/* -------------------------------- constants -------------------------------- */
const UI_FONT = "'Questrial','Raleway',-apple-system,'SF Pro Display',system-ui,sans-serif";
// Syriac must render in Serto.
const SYR_FONT = "'SertoAntiochBible',serif";

const COLORS = {
  bgLight: "#fff",
  // dim, not black
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

/* ------------------------------- utilities --------------------------------- */
function looksSyriac(text) {
  if (!text) return false;
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    if (c >= 0x0700 && c <= 0x074f) return true;
  }
  return false;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
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

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tryHaptic(kind) {
  try {
    if (navigator && navigator.vibrate) navigator.vibrate(kind === "success" ? [18, 12, 18] : [30]);
  } catch {}
}

/* --------------------------- 3D button helper ------------------------------ */
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

/* ----------------------------- UI primitives ------------------------------ */
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
              fontFamily: SYR_FONT, // ALWAYS Serto for Syriac
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

function AramMascot({ size = 72, style }) {
  // Simple inline SVG mascot (red/yellow cute eagle). No external images.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      style={{ display: 'block', ...style }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aramBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b4a" />
          <stop offset="1" stopColor="#e23a2e" />
        </linearGradient>
        <linearGradient id="aramWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd54a" />
          <stop offset="1" stopColor="#ff9f1c" />
        </linearGradient>
      </defs>

      {/* soft shadow */}
      <ellipse cx="64" cy="114" rx="34" ry="10" fill="rgba(0,0,0,0.12)" />

      {/* body */}
      <path
        d="M64 24c22 0 40 16 40 38 0 30-18 52-40 52S24 92 24 62c0-22 18-38 40-38z"
        fill="url(#aramBody)"
      />

      {/* belly */}
      <path
        d="M64 44c14 0 26 12 26 26 0 18-10 34-26 34S38 88 38 70c0-14 12-26 26-26z"
        fill="rgba(255,255,255,0.22)"
      />

      {/* wings */}
      <path d="M22 70c-10-6-14-18-6-28 10 4 18 12 22 22-6 4-10 6-16 6z" fill="url(#aramWing)" />
      <path d="M106 70c10-6 14-18 6-28-10 4-18 12-22 22 6 4 10 6 16 6z" fill="url(#aramWing)" />

      {/* face */}
      <circle cx="50" cy="58" r="8" fill="#fff" />
      <circle cx="78" cy="58" r="8" fill="#fff" />
      <circle cx="52" cy="60" r="4" fill="#2b2b2b" />
      <circle cx="80" cy="60" r="4" fill="#2b2b2b" />
      <circle cx="54" cy="58" r="1.6" fill="#fff" />
      <circle cx="82" cy="58" r="1.6" fill="#fff" />

      {/* beak */}
      <path d="M64 66c10 0 18 4 18 10 0 8-10 14-18 14s-18-6-18-14c0-6 8-10 18-10z" fill="#ffd54a" />
      <path d="M64 74c6 0 10 2 10 5 0 4-6 7-10 7s-10-3-10-7c0-3 4-5 10-5z" fill="#ff9f1c" opacity="0.9" />

      {/* brows */}
      <path d="M42 48c6-6 14-8 20-6" stroke="rgba(0,0,0,0.25)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M86 48c-6-6-14-8-20-6" stroke="rgba(0,0,0,0.25)" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
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

function Pill({ children, bg, fg }) {
  return (
    <div style={{ padding: "6px 10px", borderRadius: 999, background: bg, color: fg, fontWeight: 900, fontSize: 12 }}>
      {children}
    </div>
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

/* ------------------------------- course data ------------------------------- */
const mkUnit = (id, title, syriac, color, desc, lessons) => ({ id, title, syriac, color, desc, lessons });

// Course is now loaded from /data/course.json (scraped dataset).
// We keep this app shell structure, but generate units/lessons/exercises at runtime.

function parseIdToNums(id) {
  // '1.1.6' -> [1,1,6]
  return String(id)
    .split('.')
    .map((x) => parseInt(x, 10))
    .filter((n) => Number.isFinite(n));
}

function cmpId(a, b) {
  const A = parseIdToNums(a);
  const B = parseIdToNums(b);
  const n = Math.max(A.length, B.length);
  for (let i = 0; i < n; i++) {
    const av = A[i] ?? -1;
    const bv = B[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return String(a).localeCompare(String(b));
}

function tierForLessonId(id) {
  const nums = parseIdToNums(id);
  const major = nums[0] ?? 1;
  // More levels (still rendered as sections):
  // 1 => Beginner A, 2 => Beginner B, 3 => Intermediate A, 4 => Intermediate B, 5+ => Advanced
  if (major === 1) return 'beginnerA';
  if (major === 2) return 'beginnerB';
  if (major === 3) return 'intermediateA';
  if (major === 4) return 'intermediateB';
  return 'advanced';
}

function buildCourseFromScraped(scraped) {
  // scraped format: { lessons:[{id,title,blocks:[...]}], ... }
  const lessonsById = new Map();
  (scraped.lessons || []).forEach((l) => lessonsById.set(l.id, l));

  // Determine unit ids as two-part ids like 1.1, 1.2...
  const allIds = (scraped.lessons || []).map((l) => l.id).sort(cmpId);
  const unitIds = Array.from(
    new Set(
      allIds
        .map((id) => {
          const nums = parseIdToNums(id);
          if (nums.length >= 2) return `${nums[0]}.${nums[1]}`;
          return null;
        })
        .filter(Boolean)
    )
  );

  const course = {
    beginnerA: { title: 'Beginner A', syriac: 'ܡܫܪܝܐ', color: COLORS.beginner, units: [] },
    beginnerB: { title: 'Beginner B', syriac: 'ܡܫܪܝܐ', color: COLORS.beginner, units: [] },
    intermediateA: { title: 'Intermediate A', syriac: 'ܡܶܨܥܳܝܐ', color: COLORS.intermediate, units: [] },
    intermediateB: { title: 'Intermediate B', syriac: 'ܡܶܨܥܳܝܐ', color: COLORS.intermediate, units: [] },
    advanced: { title: 'Advanced', syriac: 'ܥܰܡܝܩܳܐ', color: COLORS.advanced, units: [] },
  };

  // Lessons map must exist before we start creating unit checkpoint lessons.
  const LESSONS = {};

  // For each unitId, collect substages (ids starting with unitId + '.')
  for (const unitId of unitIds) {
    const sub = allIds.filter((id) => id.startsWith(unitId + '.'));
    if (!sub.length) continue;

    const unitPage = lessonsById.get(unitId);
    const unitTitle = unitPage?.title || `Unit ${unitId}`;

    const tierId = tierForLessonId(unitId);
    const unitColor = course[tierId].color;

    // Description: first non-empty paragraph from unitPage (if present)
    let desc = '';
    if (unitPage?.blocks) {
      const p = unitPage.blocks.find((b) => b.type === 'paragraph' && String(b.text || '').trim());
      desc = p ? String(p.text).trim() : '';
    }

    // Syriac label: first Syriac text found in title or blocks
    let syriac = '';
    const titleParts = String(unitTitle).split('|').map((x) => x.trim());
    const maybeSy = titleParts.find((t) => looksSyriac(t));
    if (maybeSy) syriac = maybeSy;

    const unitLessonId = `unit:${unitId}`;
    const reviewLessonId = `review:${unitId}`;

    // Unit-first path: start with a unit checkpoint, then substages, then a review checkpoint.
    // For alphabet units: drop pure-intro substages (like "One language, two alphabets") so we start at letters.
    const subFiltered = (/alphabet|olafbe/i.test(String(titleParts[0] || unitTitle)))
      ? sub.filter((sid) => {
          const sp = lessonsById.get(sid);
          if (!sp) return true;
          const hasAlpha = extractAlphabetRows(sp.blocks || []).length > 0;
          const hasVocab = extractVocabRows(sp.blocks || []).length > 0;
          return hasAlpha || hasVocab;
        })
      : sub;

    const unit = mkUnit(
      unitLessonId,
      titleParts[0] || unitTitle,
      syriac,
      unitColor,
      desc || 'Practice with short steps',
      [unitLessonId, ...subFiltered, reviewLessonId]
    );
    course[tierId].units.push(unit);

    // Unit checkpoint lesson using the unit container page (if any)
    const unitParas = takeParagraphs(unitPage?.blocks || [], 3);
    const unitVocab = extractVocabRows(unitPage?.blocks || []);

    // Pull from substages.
    const unitVocabAll = [];
    const unitAlphaAll = [];
    for (const sid of sub) {
      const sp = lessonsById.get(sid);
      if (!sp) continue;
      unitVocabAll.push(...extractVocabRows(sp.blocks || []));
      unitAlphaAll.push(...extractAlphabetRows(sp.blocks || []));
    }

    const isAlphabetUnit = /alphabet|olafbe/i.test(String(titleParts[0] || unitTitle));

    // If Alphabet unit: prefer alphabet table for the intro + drills.
    const introVocab = isAlphabetUnit && unitAlphaAll.length
      ? unitAlphaAll.slice(0, 20).map((r) => [r.name, (r.sound && r.sound !== '-' ? r.sound : 'letter'), r.letter])
      : (unitVocab.length ? unitVocab : unitVocabAll).slice(0, 20);

    // Give a student-friendly plan even if unit page text is weak.
    const friendlyDesc = isAlphabetUnit
      ? 'In this unit you will learn the Syriac letters (Serto script) and practice recognizing and matching them.'
      : (unitParas.join(' ') || 'In this unit you will learn key words and practice them with short exercises.');

    const unitExercises = isAlphabetUnit && unitAlphaAll.length
      ? generateAlphabetExercises(unitAlphaAll, 14)
      : generateExercisesFromVocab(unitVocab.length ? unitVocab : unitVocabAll, 10);

    LESSONS[unitLessonId] = {
      id: unitLessonId,
      title: `${titleParts[0] || unitTitle} — Unit`,
      xp: 10,
      intro: {
        title: titleParts[0] || unitTitle,
        desc: friendlyDesc,
        vocab: introVocab,
        grammar: 'Learn → Practice → Review',
      },
      ex: unitExercises,
    };

    // Review checkpoint: build from vocab across the unit substages
    LESSONS[reviewLessonId] = {
      id: reviewLessonId,
      title: `${titleParts[0] || unitTitle} — Review`,
      xp: 15,
      intro: {
        title: 'Review',
        desc: 'Quick review to lock in what you learned in this unit.',
        vocab: isAlphabetUnit && unitAlphaAll.length
          ? unitAlphaAll.slice(0, 20).map((r) => [r.name, (r.sound && r.sound !== '-' ? r.sound : 'letter'), r.letter])
          : unitVocabAll.slice(0, 20),
      },
      ex: (isAlphabetUnit && unitAlphaAll.length)
        ? generateAlphabetExercises(unitAlphaAll, 16)
        : generateExercisesFromVocab(unitVocabAll, 16),
    };
  }

  // Build lesson objects for each sub id.

  function takeParagraphs(blocks, limit = 3) {
    const out = [];
    for (const b of blocks || []) {
      if (b.type !== 'paragraph') continue;
      const t = String(b.text || '').trim();
      if (!t) continue;
      // Remove references to video/image instructions
      if (/video-?clip|watch this video|listen to/i.test(t)) continue;
      out.push(t);
      if (out.length >= limit) break;
    }
    return out;
  }

  function extractAlphabetRows(blocks) {
    // Rows like: [Name, Sound (value), Letter]
    const out = [];
    let seenHeader = false;
    for (const b of blocks || []) {
      if (b.type !== 'table_row') continue;
      const cells = Array.isArray(b.cells) ? b.cells : [];
      const c = cells.map((x) => String(x || '').trim()).filter(Boolean);
      if (c.length < 3) continue;

      const a = c[0];
      const s = c[1];
      const l = c[2];

      if (!seenHeader) {
        if (a.toLowerCase() === 'name' && s.toLowerCase().includes('sound') && (l.toLowerCase() === 'letter' || looksSyriac(l))) {
          seenHeader = true;
          continue;
        }
      }

      // Letter cell should look Syriac and be short
      if (!looksSyriac(l)) continue;
      if (l.length > 6) continue;
      if (!a) continue;

      // Skip obvious noise
      if (a.toLowerCase() === 'surayt in syriac script') continue;

      out.push({ name: a, sound: s, letter: l });
      if (out.length >= 40) break;
    }
    return out;
  }

  function extractVocabRows(blocks) {
    // Prefer table rows like [latin, meaning, syriac]
    const rows = [];
    for (const b of blocks || []) {
      if (b.type !== 'table_row') continue;
      const cells = b.cells || [];
      if (!Array.isArray(cells)) continue;
      const c = cells.map((x) => String(x || '').trim()).filter((x) => x.length);
      if (c.length < 2) continue;
      // common headers
      const joined = c.join(' ').toLowerCase();
      if (joined === 'vocabulary' || joined === 'exercises') continue;

      // vocab rows are often 3 cells
      if (c.length >= 3) {
        const [latin, meaning, syriac] = c;
        if (!latin || !meaning) continue;
        // filter header rows
        if (latin.toLowerCase() === 'name' && meaning.toLowerCase().includes('sound')) continue;
        rows.push([latin, meaning, syriac]);
      }
    }
    // Dedupe
    const seen = new Set();
    return rows.filter((r) => {
      const k = r.join('|');
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function generateAlphabetExercises(alphaRows, count = 14) {
    const rows = (alphaRows || []).filter((r) => r.name && r.letter);
    if (!rows.length) return [];

    const out = [];

    // Match name -> letter (core)
    const pairs = rows.slice(0, 8).map((r) => [r.name, r.letter]);
    if (pairs.length >= 3) out.push({ type: 'match', pairs: pairs.slice(0, 6) });

    // Select: pick the letter for a name
    for (const r of rows) {
      if (out.length >= count) break;
      const opts = [r.letter];
      while (opts.length < 4 && opts.length < rows.length) {
        const cand = rows[Math.floor(Math.random() * rows.length)].letter;
        if (!opts.includes(cand)) opts.push(cand);
      }
      out.push({ type: 'select', q: `Select the Syriac letter for: ${r.name}${r.sound && r.sound !== '-' ? ` (${r.sound})` : ''}`, options: shuffle(opts), a: r.letter });
    }

    // Type: type the latin name for a letter
    for (const r of rows) {
      if (out.length >= count) break;
      out.push({ type: 'type', q: `Type the letter name for: ${r.letter}`, a: r.name, al: [r.name] });
    }

    // True/False variety
    for (const r of rows) {
      if (out.length >= count) break;
      const wrong = rows[Math.floor(Math.random() * rows.length)];
      const isTrue = Math.random() < 0.6;
      const shown = isTrue ? r.letter : wrong.letter;
      out.push({ type: 'truefalse', q: `${r.name} is written as ${shown}.`, a: isTrue ? true : shown === r.letter });
    }

    return out.slice(0, count);
  }

  function generateExercisesFromVocab(vocab, count = 12) {
    // Mix of exercise types derived from vocab rows, with repetition control.
    const items = vocab.filter((v) => v[0] && v[1]);
    const poolLatin = items.map((v) => v[0]);
    const poolMeaning = items.map((v) => v[1]);

    if (!items.length) return [];

    const out = [];
    const take = items.slice(0, Math.min(items.length, 18));

    const push = (e) => {
      if (out.length < count) out.push(e);
    };

    // Always start with one match when we can (variety boost)
    const syPairs = take
      .filter((v) => v[2] && looksSyriac(v[2]))
      .slice(0, 8)
      .map((v) => [v[0], v[2]]);
    if (syPairs.length >= 3) push({ type: 'match', pairs: syPairs.slice(0, 6) });

    // Then rotate through types without spamming the same prompt.
    const rotated = shuffle(take);

    for (const v of rotated) {
      if (out.length >= count) break;
      const [latin, meaning] = v;

      // select
      if (out.filter((x) => x.type === 'select').length < 3) {
        const opts = [latin];
        while (opts.length < 4 && opts.length < poolLatin.length) {
          const cand = poolLatin[Math.floor(Math.random() * poolLatin.length)];
          if (!opts.includes(cand)) opts.push(cand);
        }
        push({ type: 'select', q: `Choose the Turoyo word for: "${meaning}"`, options: shuffle(opts), a: latin, al: [latin] });
        continue;
      }

      // type
      if (out.filter((x) => x.type === 'type').length < 3) {
        push({ type: 'type', q: `Type the Turoyo word for: "${meaning}"`, a: latin, al: [latin] });
        continue;
      }

      // fill
      if (out.filter((x) => x.type === 'fill').length < 2) {
        push({ type: 'fill', q: `Fill the blank: ___ = ${meaning}`, a: latin, al: [latin] });
        continue;
      }

      // true/false
      if (out.filter((x) => x.type === 'truefalse').length < 3) {
        const wrongMeaning = poolMeaning[Math.floor(Math.random() * poolMeaning.length)] || meaning;
        const isTrue = Math.random() < 0.6;
        const shownMeaning = isTrue ? meaning : wrongMeaning;
        const a = isTrue ? true : shownMeaning === meaning;
        push({ type: 'truefalse', q: `"${latin}" means "${shownMeaning}".`, a });
        continue;
      }

      // arrange
      if (out.filter((x) => x.type === 'arrange').length < 2) {
        const bank = shuffle([latin, '=', ...String(meaning).split(/\s+/).filter(Boolean)]);
        const ans = [latin, '=', ...String(meaning).split(/\s+/).filter(Boolean)].join(' ');
        push({ type: 'arrange', q: 'Arrange:', bank, a: ans, al: [ans] });
        continue;
      }
    }

    // Backfill with select if still short
    while (out.length < count && take.length) {
      const v = take[Math.floor(Math.random() * take.length)];
      const [latin, meaning] = v;
      const opts = [latin];
      while (opts.length < 4 && opts.length < poolLatin.length) {
        const cand = poolLatin[Math.floor(Math.random() * poolLatin.length)];
        if (!opts.includes(cand)) opts.push(cand);
      }
      push({ type: 'select', q: `Choose the Turoyo word for: "${meaning}"`, options: shuffle(opts), a: latin, al: [latin] });
    }

    return out.slice(0, count);
  }

  for (const id of allIds) {
    if (!id.includes('.')) continue;
    const nums = parseIdToNums(id);
    if (nums.length < 3) continue; // only sub-stages become lessons

    const src = lessonsById.get(id);
    const title = src?.title || `Lesson ${id}`;
    const blocks = src?.blocks || [];

    const paras = takeParagraphs(blocks, 3);
    const vocab = extractVocabRows(blocks);

    const alpha = extractAlphabetRows(blocks);
    const isAlphaPage = alpha.length >= 6;

    const intro = {
      title: String(title).split('|')[0].trim(),
      desc: (paras.join(' ') || (isAlphaPage ? 'Learn these letters, then practice matching and recognizing them.' : 'Learn the key points, then practice.')),
      vocab: isAlphaPage
        ? alpha.slice(0, 20).map((r) => [r.name, (r.sound && r.sound !== '-' ? r.sound : 'letter'), r.letter])
        : vocab.slice(0, 20),
    };

    // Generate exercises even for non-vocab pages when possible.
    let ex = [];
    if (isAlphaPage) {
      ex = generateAlphabetExercises(alpha, 14);
    } else if (vocab.length) {
      ex = generateExercisesFromVocab(vocab, 10);
    } else if (paras.length) {
      // Paragraph-only lessons: small comprehension set.
      ex = [
        { type: 'truefalse', q: 'This lesson uses both Syriac script and Latin transliteration.', a: true },
        { type: 'select', q: 'Which script is read right-to-left?', options: shuffle(['Syriac', 'Latin', 'English', 'Swedish']), a: 'Syriac' },
        { type: 'truefalse', q: 'Latin transliteration is read right-to-left.', a: false },
      ];
    }

    LESSONS[id] = {
      id,
      title: String(title).split('|')[0].trim(),
      xp: 10,
      intro,
      ex,
    };
  }

  return { course, lessons: LESSONS };
}

function flattenCourse(course, LESSONS) {
  const tiers = ["beginnerA", "beginnerB", "intermediateA", "intermediateB", "advanced"];
  const flat = [];
  const idx = {};
  for (const tierId of tiers) {
    const tier = course[tierId];
    (tier.units || []).forEach((u) => {
      (u.lessons || []).forEach((lessonId) => {
        // unit.lessons are substage ids from scraped dataset
        const lesson = LESSONS[lessonId] || { id: lessonId, title: "Coming soon", xp: 10, intro: { title: "Coming soon" }, ex: [] };
        const item = { tierId, tier, unit: u, lesson };
        idx[lesson.id] = flat.length;
        flat.push(item);
      });
    });
  }
  return { flat, idx };
}

/* ------------------------------ pages (structure) -------------------------- */
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
          {mode === "signup" ? <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (optional)" style={fieldStyle} /> : null}
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
    { title: "How Lessons Work", body: "Each lesson has a Learn intro and Exercises. You select then press CHECK." },
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

function SectionCard({ title, icon, dark, kind, children }) {
  const palettes = {
    dialogue: { bg: dark ? COLORS.dialogueDark : COLORS.dialogueLight, fg: dark ? "#bbdefb" : "#0d47a1" },
    grammar: { bg: dark ? COLORS.grammarDark : COLORS.grammarLight, fg: dark ? "#ffe0b2" : "#e65100" },
    culture: { bg: dark ? COLORS.cultureDark : COLORS.cultureLight, fg: dark ? "#e1bee7" : "#6a1b9a" },
    vocab: { bg: dark ? "rgba(13,42,26,1)" : "rgba(232,245,233,1)", fg: dark ? "#b9f6ca" : "#1b5e20" },
  };
  const p = palettes[kind] || { bg: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", fg: dark ? "#e0e0e0" : "#333" };
  return (
    <div style={{ background: p.bg, borderRadius: 18, padding: 14, border: "1px solid rgba(0,0,0,0.06)", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontWeight: 900, color: p.fg }}>{icon}</span>
        </div>
        <div style={{ fontWeight: 900, color: p.fg }}>{title}</div>
      </div>
      <div style={{ color: p.fg }}>{children}</div>
    </div>
  );
}

function VocabGrid({ rows, dark }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => {
        const [latin, meaning, syriac] = r;
        return (
          <div key={i} style={{
            background: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.7)",
            borderRadius: 14,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontWeight: 900 }}>{latin}</div>
              <div style={{ opacity: 0.85, fontWeight: 700 }}>{meaning}</div>
            </div>
            <div style={{ fontWeight: 900 }}><Syriac>{syriac || ""}</Syriac></div>
          </div>
        );
      })}
    </div>
  );
}

function LessonIntro({ lesson, dark, onStart }) {
  const intro = lesson.intro || {};
  const tStart = btn3d(COLORS.accentShadow);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, opacity: 0.75 }}>Aram</div>
        <AramMascot size={64} />
      </div>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}><Syriac>{intro.title || lesson.title}</Syriac></div>
      {intro.desc ? <div style={{ fontWeight: 900, opacity: 0.75, lineHeight: 1.35, marginBottom: 12 }}><Syriac>{intro.desc}</Syriac></div> : null}

      {Array.isArray(intro.dialog) && intro.dialog.length ? (
        <SectionCard title="Dialogue" icon="D" dark={dark} kind="dialogue">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {intro.dialog.map((line, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 14, background: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{line.a}</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>{line.t}</div>
                  <div style={{ fontWeight: 900 }}><Syriac>{line.s}</Syriac></div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {Array.isArray(intro.vocab) && intro.vocab.length ? (
        <SectionCard title="Vocabulary" icon="V" dark={dark} kind="vocab">
          <VocabGrid rows={intro.vocab} dark={dark} />
        </SectionCard>
      ) : null}

      {intro.grammar ? (
        <SectionCard title="Grammar" icon="G" dark={dark} kind="grammar">
          <div style={{ fontWeight: 800, lineHeight: 1.35 }}><Syriac>{intro.grammar}</Syriac></div>
        </SectionCard>
      ) : null}

      {intro.culture ? (
        <SectionCard title="Culture" icon="C" dark={dark} kind="culture">
          <div style={{ fontWeight: 800, lineHeight: 1.35 }}><Syriac>{intro.culture}</Syriac></div>
        </SectionCard>
      ) : null}

      <div role="button" tabIndex={0} onClick={onStart} {...tStart} style={{
        ...tStart.style,
        background: COLORS.accent,
        color: "#0b2a00",
        borderRadius: 18,
        padding: "14px 14px",
        fontWeight: 900,
        textAlign: "center",
        border: "1px solid rgba(0,0,0,0.08)",
      }}>Start Exercises</div>
    </div>
  );
}

function ExercisePage({ lesson, dark, unitColor, hearts, setHearts, onDone, onExit }) {
  const exList = lesson.ex || [];
  const [exIdx, setExIdx] = useState(0);
  const [fb, setFb] = useState(null);
  const [confKey, setConfKey] = useState(0);

  const [sel, setSel] = useState(null);
  const [input, setInput] = useState("");
  const [arranged, setArranged] = useState([]);
  const [matchState, setMatchState] = useState(null);

  const ex = exList[exIdx];

  useEffect(() => {
    setFb(null);
    setSel(null);
    setInput("");
    setArranged([]);
    setMatchState(null);

    if (ex && ex.type === "match") {
      const map = Object.fromEntries(ex.pairs.map(([l, r]) => [l, r]));
      setMatchState({
        L: shuffle(ex.pairs.map((p) => p[0])),
        R: shuffle(ex.pairs.map((p) => p[1])),
        selL: null,
        selR: null,
        matched: {},
        map,
      });
    }
  }, [exIdx]);

  const canCheck = useMemo(() => {
    if (!ex) return false;
    if (ex.type === "match") return false;
    if (fb) return true;
    if (ex.type === "select" || ex.type === "truefalse") return sel != null;
    if (ex.type === "type" || ex.type === "fill") return input.trim().length > 0;
    if (ex.type === "arrange") return arranged.length > 0;
    return false;
  }, [ex, sel, input, arranged, fb]);

  const correctAnswerText = useMemo(() => {
    if (!ex) return "";
    if (ex.type === "select") return ex.a;
    if (ex.type === "truefalse") return ex.a ? "šrolo" : "ġalṭo";
    if (ex.type === "type" || ex.type === "fill") return ex.a;
    if (ex.type === "arrange") return ex.a;
    return "";
  }, [ex]);

  const lose = () => {
    setHearts((h) => Math.max(0, h - 1));
    tryHaptic("error");
  };

  const check = () => {
    if (!ex) return;
    if (fb) {
      const next = exIdx + 1;
      if (next < exList.length) setExIdx(next);
      else onDone();
      return;
    }

    let ok = false;
    if (ex.type === "select") ok = sel === ex.a || answerMatch(sel, ex.a, ex.al);
    if (ex.type === "truefalse") ok = (sel === "šrolo") === !!ex.a;
    if (ex.type === "type" || ex.type === "fill") ok = answerMatch(input, ex.a, ex.al);
    if (ex.type === "arrange") ok = answerMatch(arranged.join(" "), ex.a, ex.al);

    if (ok) {
      tryHaptic("success");
      setFb({ ok: true });
      setConfKey((k) => k + 1);
    } else {
      lose();
      setFb({ ok: false, correct: correctAnswerText });
    }
  };

  // match auto-complete
  useEffect(() => {
    if (!ex || ex.type !== "match" || !matchState) return;
    if (matchState.selL == null || matchState.selR == null) return;

    const ok = matchState.map[matchState.selL] === matchState.selR;
    if (ok) {
      tryHaptic("success");
      const nextMatched = { ...matchState.matched, [matchState.selL]: matchState.selR };
      const doneCount = Object.keys(nextMatched).length;
      setMatchState((ms) => ({ ...ms, selL: null, selR: null, matched: nextMatched }));
      if (doneCount === ex.pairs.length) {
        setTimeout(() => {
          const next = exIdx + 1;
          if (next < exList.length) setExIdx(next);
          else onDone();
        }, 250);
      }
    } else {
      lose();
      setMatchState((ms) => ({ ...ms, selL: null, selR: null }));
    }
  }, [matchState?.selL, matchState?.selR]);

  useEffect(() => {
    if (hearts <= 0) onDone();
  }, [hearts]);

  if (!ex) return null;

  const option3d = btn3d("#d0d0d0", { up: 4, down: 1, pressY: 3 });

  const skipExercise = () => {
    const next = exIdx + 1;
    if (next < exList.length) setExIdx(next);
    else onDone();
  };

  return (
    <div style={{ position: "relative", paddingBottom: ex.type === "match" ? 24 : 92 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div role="button" tabIndex={0} onClick={onExit} {...btn3d("rgba(0,0,0,0.14)")} style={{
          ...btn3d("rgba(0,0,0,0.14)").style,
          padding: '10px 12px',
          borderRadius: 18,
          background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.10)',
          fontWeight: 900,
          minWidth: 44,
          textAlign: 'center'
        }}>✕</div>
        <div style={{ fontWeight: 900, opacity: 0.75 }}>Exercise {exIdx + 1}/{exList.length}</div>
        <div role="button" tabIndex={0} onClick={skipExercise} {...btn3d("#d0d0d0")} style={{
          ...btn3d("#d0d0d0").style,
          padding: '10px 12px',
          borderRadius: 18,
          background: 'transparent',
          border: `2px solid ${dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'}`,
          boxShadow: 'none',
          fontWeight: 900,
          minWidth: 72,
          textAlign: 'center'
        }}>Skip</div>
      </div>
      {fb?.ok ? <Confetti seedKey={confKey} accent={unitColor} anim="miniConfetti" /> : null}

      <Card dark={dark}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12, lineHeight: 1.25 }}><Syriac>{ex.q || (ex.type === "match" ? "Match pairs" : "")}</Syriac></div>

        {ex.type === "select" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            {ex.options.map((o) => {
              const isSel = sel === o;
              return (
                <div key={o} role="button" tabIndex={0} onClick={() => !fb && setSel(o)} {...option3d} style={{
                  ...option3d.style,
                  padding: "12px 12px",
                  borderRadius: 18,
                  background: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
                  border: `2px solid ${isSel ? COLORS.accent : "rgba(0,0,0,0.12)"}`,
                  fontWeight: 900,
                  textAlign: "center",
                }}><Syriac>{o}</Syriac></div>
              );
            })}
          </div>
        ) : null}

        {ex.type === "truefalse" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div role="button" tabIndex={0} onClick={() => !fb && setSel("šrolo")} {...btn3d(COLORS.accentShadow)} style={{
              ...btn3d(COLORS.accentShadow).style,
              padding: 14,
              borderRadius: 18,
              border: `2px solid ${sel === "šrolo" ? "#fff" : "rgba(255,255,255,0)"}`,
              background: COLORS.accent,
              color: "#0b2a00",
              opacity: sel === "ġalṭo" ? 0.5 : 1,
              fontWeight: 900,
              textAlign: "center",
            }}>šrolo — True</div>
            <div role="button" tabIndex={0} onClick={() => !fb && setSel("ġalṭo")} {...btn3d("rgba(140,0,0,0.45)")} style={{
              ...btn3d("rgba(140,0,0,0.45)").style,
              padding: 14,
              borderRadius: 18,
              border: `2px solid ${sel === "ġalṭo" ? "#fff" : "rgba(255,255,255,0)"}`,
              background: COLORS.error,
              color: "#fff",
              opacity: sel === "šrolo" ? 0.5 : 1,
              fontWeight: 900,
              textAlign: "center",
            }}>ġalṭo — False</div>
          </div>
        ) : null}

        {ex.type === "type" || ex.type === "fill" ? (
          <div style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
            borderRadius: 18,
            padding: "12px 12px",
            border: "1px solid rgba(0,0,0,0.12)",
          }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type here" style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: UI_FONT,
              fontSize: 16,
              fontWeight: 800,
              color: dark ? COLORS.fgDark : COLORS.fgLight,
            }} />
          </div>
        ) : null}

        {ex.type === "arrange" ? (
          <div>
            <div style={{
              minHeight: 56,
              borderRadius: 18,
              padding: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              background: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}>
              {arranged.map((w, i) => (
                <div key={i + w} role="button" tabIndex={0} onClick={() => !fb && setArranged((a) => a.filter((_, j) => j !== i))} {...btn3d("#d0d0d0")} style={{
                  ...btn3d("#d0d0d0").style,
                  padding: "8px 10px",
                  borderRadius: 16,
                  background: dark ? COLORS.bgDark : "#fff",
                  border: "1px solid rgba(0,0,0,0.12)",
                  fontWeight: 900,
                }}><Syriac>{w}</Syriac></div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(ex.bank || []).map((w, i) => (
                <div key={i + w} role="button" tabIndex={0} onClick={() => !fb && setArranged((a) => [...a, w])} {...btn3d("#d0d0d0")} style={{
                  ...btn3d("#d0d0d0").style,
                  padding: "8px 10px",
                  borderRadius: 16,
                  background: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(0,0,0,0.12)",
                  fontWeight: 900,
                }}><Syriac>{w}</Syriac></div>
              ))}
            </div>
          </div>
        ) : null}

        {ex.type === "match" && matchState ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matchState.L.map((l) => {
                const locked = !!matchState.matched[l];
                const isSel = matchState.selL === l;
                const t = btn3d("#d0d0d0");
                return (
                  <div key={l} role="button" tabIndex={0} onClick={() => !locked && setMatchState((ms) => ({ ...ms, selL: l }))} {...t} style={{
                    ...t.style,
                    padding: 12,
                    borderRadius: 18,
                    background: locked ? "rgba(88,204,2,0.18)" : dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
                    border: `2px solid ${isSel ? COLORS.accent : locked ? "rgba(88,204,2,0.25)" : "rgba(0,0,0,0.12)"}`,
                    fontWeight: 900,
                    textAlign: "center",
                  }}><Syriac>{l}</Syriac></div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matchState.R.map((r) => {
                const locked = Object.values(matchState.matched).includes(r);
                const isSel = matchState.selR === r;
                const t = btn3d("#d0d0d0");
                return (
                  <div key={r} role="button" tabIndex={0} onClick={() => !locked && setMatchState((ms) => ({ ...ms, selR: r }))} {...t} style={{
                    ...t.style,
                    padding: 12,
                    borderRadius: 18,
                    background: locked ? "rgba(88,204,2,0.18)" : dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
                    border: `2px solid ${isSel ? COLORS.accent : locked ? "rgba(88,204,2,0.25)" : "rgba(0,0,0,0.12)"}`,
                    fontWeight: 900,
                    textAlign: "center",
                  }}><Syriac>{r}</Syriac></div>
                );
              })}
            </div>
          </div>
        ) : null}

        {fb && !fb.ok && fb.correct ? (
          <div style={{ marginTop: 12, fontWeight: 900, opacity: 0.85 }}>Correct: <Syriac>{fb.correct}</Syriac></div>
        ) : null}
      </Card>

      {ex.type !== "match" ? (
        <div style={{ position: "fixed", left: 20, right: 20, bottom: 20, zIndex: 60 }}>
          {!fb ? (
            <div role="button" tabIndex={0} onClick={canCheck ? check : undefined} {...btn3d(COLORS.accentShadow)} style={{
              ...btn3d(COLORS.accentShadow).style,
              width: "100%",
              borderRadius: 18,
              padding: "14px 14px",
              textAlign: "center",
              fontWeight: 900,
              background: canCheck ? COLORS.accent : dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
              color: canCheck ? "#0b2a00" : dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
              boxShadow: canCheck ? btn3d(COLORS.accentShadow).style.boxShadow : "none",
              border: "1px solid rgba(0,0,0,0.08)",
              cursor: canCheck ? "pointer" : "not-allowed",
            }}>CHECK</div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{
                flex: 1,
                borderRadius: 18,
                padding: "14px 14px",
                fontWeight: 900,
                background: fb.ok ? "rgba(88,204,2,0.20)" : "rgba(255,75,75,0.16)",
                color: fb.ok ? COLORS.accent : COLORS.error,
                border: "1px solid rgba(0,0,0,0.10)",
                animation: fb.ok ? "correctPulse 0.4s ease 1" : "none",
                display: "flex",
                alignItems: "center",
              }}>{fb.ok ? "✓ Correct!" : "✗ Incorrect"}</div>

              <div role="button" tabIndex={0} onClick={check} {...btn3d("rgba(0,0,0,0.14)")} style={{
                ...btn3d("rgba(0,0,0,0.14)").style,
                flex: 1,
                borderRadius: 18,
                padding: "14px 14px",
                textAlign: "center",
                fontWeight: 900,
                background: "rgba(255,255,255,0.96)",
                color: "#111",
                border: "1px solid rgba(0,0,0,0.14)",
                animation: "slideInRight 0.3s ease 1",
              }}>Next →</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PathView({ dark, course, flat, idx, done, setDone, streak, xp, hearts, dailyGoal, dailyXp, setPage, startLesson }) {
  const bg = dark ? COLORS.bgDark : COLORS.bgLight;
  const fg = dark ? COLORS.fgDark : COLORS.fgLight;

  const unlockedSet = useMemo(() => {
    const s = new Set();
    flat.forEach((item, i) => {
      if (i === 0) s.add(item.lesson.id);
      else if (done.includes(flat[i - 1].lesson.id)) s.add(item.lesson.id);
    });
    return s;
  }, [flat, done]);

  const goalPct = clamp(Math.round((dailyXp / Math.max(1, dailyGoal)) * 100), 0, 100);
  const nodeOffsets = [0, 72, 0, -72];

  const [popupLesson, setPopupLesson] = useState(null);
  const [popupPos, setPopupPos] = useState(null);

  const onNodeClick = (lessonId, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupLesson(lessonId);
    setPopupPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const closePopup = () => {
    setPopupLesson(null);
    setPopupPos(null);
  };

  const popupItem = popupLesson ? flat[idx[popupLesson]] : null;
  const unlocked = popupItem ? unlockedSet.has(popupItem.lesson.id) : false;

  const skipHere = () => {
    if (!popupLesson) return;
    const i = idx[popupLesson];
    if (i == null) return;
    const prior = flat.slice(0, i).map((x) => x.lesson.id);
    setDone((d) => Array.from(new Set([...d, ...prior])));
    closePopup();
  };

  const overlay = popupLesson ? (
    <div onClick={closePopup} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 70 }} />
  ) : null;

  const popup = popupLesson && popupPos && popupItem ? (
    <div style={{ position: "fixed", left: popupPos.x, top: popupPos.y, transform: "translate(-50%, -12px)", zIndex: 75, width: 280 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: dark ? COLORS.cardDark : "#fff", borderRadius: 18, padding: 14, border: "1px solid rgba(0,0,0,0.14)", boxShadow: "0 12px 30px rgba(0,0,0,0.18)" }}>
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>{popupItem.lesson.title}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <Pill bg="rgba(28,176,246,0.14)" fg={COLORS.info}>XP {popupItem.lesson.xp || 10}</Pill>
          <Pill bg={dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"} fg={fg}>Exercises {(popupItem.lesson.ex || []).length}</Pill>
        </div>

        {unlocked ? (
          <div role="button" tabIndex={0} onClick={() => { closePopup(); startLesson(popupItem.lesson.id); }} {...btn3d(COLORS.accentShadow)} style={{
            ...btn3d(COLORS.accentShadow).style,
            background: COLORS.accent,
            color: "#0b2a00",
            borderRadius: 18,
            padding: "12px 12px",
            textAlign: "center",
            fontWeight: 900,
            border: "1px solid rgba(0,0,0,0.08)",
          }}>Start Lesson</div>
        ) : (
          <div role="button" tabIndex={0} onClick={skipHere} {...btn3d("rgba(0,0,0,0.14)")} style={{
            ...btn3d("rgba(0,0,0,0.14)").style,
            background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
            color: dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)",
            borderRadius: 18,
            padding: "12px 12px",
            textAlign: "center",
            fontWeight: 900,
            border: "1px solid rgba(0,0,0,0.10)",
          }}>⏭ Skip here</div>
        )}
      </div>
      <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: `10px solid ${dark ? COLORS.cardDark : "#fff"}`, margin: "0 auto", filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.10))" }} />
    </div>
  ) : null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: bg, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
            <div style={{ fontSize: 18 }}>🦅</div>
            <div style={{ fontSize: 16 }}>Leshono</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill bg="rgba(255,150,0,0.16)" fg={COLORS.streak}>🔥 {streak}</Pill>
            <Pill bg="rgba(28,176,246,0.14)" fg={COLORS.info}>⭐ {xp}</Pill>
            <Pill bg={dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"} fg={fg}>❤️ {hearts}</Pill>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 92 }}>
        <Card dark={dark} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Daily goal</div>
              <div style={{ fontWeight: 900, opacity: 0.7, marginTop: 2 }}>{dailyXp}/{dailyGoal} XP</div>
            </div>
            <div style={{ width: 64 }}>
              <div style={{ height: 10, background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${goalPct}%`, height: "100%", background: COLORS.accent }} />
              </div>
              <div style={{ textAlign: "right", marginTop: 6, fontWeight: 900, fontSize: 12, opacity: 0.7 }}>{goalPct}%</div>
            </div>
          </div>
        </Card>

        {['beginnerA','beginnerB','intermediateA','intermediateB','advanced']
          .map((k) => course[k])
          .filter(Boolean)
          .map((sec) => (
          <div key={sec.title} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: sec.color }} />
                <div style={{ fontWeight: 900, fontSize: 18 }}>{sec.title}</div>
              </div>
              <div style={{ fontWeight: 900, opacity: 0.9 }}><Syriac>{sec.syriac}</Syriac></div>
            </div>

            {sec.units.map((u) => (
              <div key={u.id} style={{ marginBottom: 18 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 20, background: `${u.color}18`, border: `1px solid ${u.color}33`, fontWeight: 900, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: u.color }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontWeight: 900 }}>{u.title}</div>
                    <div style={{ fontWeight: 900, opacity: 0.75, fontSize: 12 }}><Syriac>{u.syriac}</Syriac> • {u.desc}</div>
                  </div>
                </div>

                <div style={{ position: "relative", paddingTop: 6, paddingBottom: 6 }}>
                  {u.lessons.map((lessonId, i) => {
                    const item = flat[idx[lessonId]];
                    if (!item) return null;

                    const isDone = done.includes(lessonId);
                    const isUnlocked = unlockedSet.has(lessonId);
                    const isLocked = !isUnlocked;

                    const offset = nodeOffsets[i % nodeOffsets.length];
                    const nodeSize = 78;
                    const tNode = btn3d(`${u.color}99`, { up: 8, down: 3, pressY: 3 });

                    const bgNode = isDone
                      ? u.color
                      : isUnlocked
                      ? (dark ? "rgba(255,255,255,0.96)" : "#fff")
                      : (dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)");

                    const nodeBg = isDone
                      ? bgNode
                      : isUnlocked
                      ? `linear-gradient(180deg, ${bgNode}, ${dark ? 'rgba(220,220,220,0.92)' : 'rgba(240,240,240,0.95)'})`
                      : bgNode;

                    const border = isUnlocked
                      ? `2px solid ${u.color}55`
                      : `2px solid ${dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)"}`;

                    return (
                      <div key={lessonId} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14 }}>
                        <div role="button" tabIndex={0} onClick={(e) => onNodeClick(lessonId, e)} {...tNode} style={{
                          ...tNode.style,
                          width: nodeSize,
                          height: nodeSize,
                          borderRadius: 999,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: nodeBg,
                          border,
                          transform: `translateX(${offset}px)`,
                          boxShadow: isLocked ? "none" : tNode.style.boxShadow,
                          cursor: "pointer",
                          position: "relative",
                        }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: isDone ? "#fff" : "#111" }}>
                            {isDone ? "✓" : isUnlocked ? "★" : "🔒"}
                          </div>

                          {isUnlocked && !isDone ? (
                            <div style={{ position: "absolute", inset: -6, borderRadius: 999, border: `2px solid ${u.color}55`, boxShadow: `0 0 0 6px ${u.color}22` }} />
                          ) : null}
                        </div>

                        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 900, opacity: 0.75 }}>{item.lesson.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {overlay}
      {popup}

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: 12, background: dark ? "rgba(26,26,46,0.92)" : "rgba(255,255,255,0.92)", borderTop: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(8px)", zIndex: 65 }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <IconBtn icon="🏠" active={true} dark={dark} onClick={() => setPage("home")} />
          <IconBtn icon="🎯" active={false} dark={dark} onClick={() => setPage("goals")} />
          <IconBtn icon="👤" active={false} dark={dark} onClick={() => setPage("profile")} />
        </div>
      </div>
    </div>
  );
}

function GoalsPage({ dark, dailyGoal, dailyXp, setDailyGoal, streak, setPage }) {
  const fg = dark ? COLORS.fgDark : COLORS.fgLight;
  const ringSize = 120;
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = clamp(dailyXp / Math.max(1, dailyGoal), 0, 1);
  const dash = c * (1 - pct);

  const presets = [
    { label: "Casual", goal: 10 },
    { label: "Regular", goal: 20 },
    { label: "Serious", goal: 30 },
    { label: "Intense", goal: 50 },
  ];

  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const activeDays = clamp(streak, 0, 7);

  return (
    <div style={{ padding: 16, paddingBottom: 92 }}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Goals</div>

      <Card dark={dark} style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Daily XP</div>
          <div style={{ fontWeight: 900, opacity: 0.7, marginTop: 4 }}>{dailyXp}/{dailyGoal}</div>
        </div>

        <svg width={ringSize} height={ringSize} viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={r} stroke={dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"} strokeWidth="10" fill="none" />
          <circle cx="60" cy="60" r={r} stroke={COLORS.accent} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={dash} transform="rotate(-90 60 60)" />
          <text x="60" y="66" textAnchor="middle" fontFamily={UI_FONT} fontWeight="900" fontSize="16" fill={fg}>
            {Math.round(pct * 100)}%
          </text>
        </svg>
      </Card>

      <Card dark={dark} style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Weekly streak</div>
        <div style={{ display: "flex", gap: 8 }}>
          {week.map((d, i) => {
            const on = i < activeDays;
            return (
              <div key={i} style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: on ? "rgba(255,150,0,0.18)" : dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
                border: `1px solid ${on ? "rgba(255,150,0,0.35)" : "rgba(0,0,0,0.08)"}`,
                fontWeight: 900,
                color: on ? COLORS.streak : dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.60)",
              }}>{d}</div>
            );
          })}
        </div>
      </Card>

      <Card dark={dark}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Set your goal</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
      </Card>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: 12, background: dark ? "rgba(26,26,46,0.92)" : "rgba(255,255,255,0.92)", borderTop: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(8px)", zIndex: 65 }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <IconBtn icon="🏠" active={false} dark={dark} onClick={() => setPage("home")} />
          <IconBtn icon="🎯" active={true} dark={dark} onClick={() => setPage("goals")} />
          <IconBtn icon="👤" active={false} dark={dark} onClick={() => setPage("profile")} />
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ dark, setDark, lang, setLang, user, setUser, xp, streak, doneCount, perSectionProgress, resetAll, logout, setPage }) {
  const fg = dark ? COLORS.fgDark : COLORS.fgLight;
  return (
    <div style={{ padding: 16, paddingBottom: 92 }}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Profile</div>

      <Card dark={dark} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 54, height: 54, borderRadius: 999, background: "rgba(88,204,2,0.18)", border: "1px solid rgba(88,204,2,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: COLORS.accent, fontSize: 18 }}>
            {(user?.username || "A").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{user?.username || "Guest"}</div>
            <div style={{ opacity: 0.7, fontWeight: 900, marginTop: 2 }}>Level {Math.max(1, Math.floor(xp / 100) + 1)}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ height: 10, background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${xp % 100}%`, height: "100%", background: COLORS.info }} />
          </div>
          <div style={{ marginTop: 6, fontWeight: 900, fontSize: 12, opacity: 0.7 }}>XP {xp}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{xp}</div>
            <div style={{ fontWeight: 900, opacity: 0.7, fontSize: 12 }}>XP</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{streak}</div>
            <div style={{ fontWeight: 900, opacity: 0.7, fontSize: 12 }}>Streak</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{doneCount}</div>
            <div style={{ fontWeight: 900, opacity: 0.7, fontSize: 12 }}>Lessons</div>
          </div>
        </div>
      </Card>

      <Card dark={dark} style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Progress</div>
        {perSectionProgress.map((s) => (
          <div key={s.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>{s.title}</div>
              <div style={{ fontWeight: 900, opacity: 0.7 }}>{s.pct}%</div>
            </div>
            <div style={{ marginTop: 6, height: 10, background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${s.pct}%`, height: "100%", background: s.color }} />
            </div>
          </div>
        ))}
      </Card>

      <Card dark={dark} style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Settings</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 900 }}>Dark mode</div>
          <div role="button" tabIndex={0} onClick={() => setDark((d) => !d)} {...btn3d("#d0d0d0")} style={{
            ...btn3d("#d0d0d0").style,
            padding: "10px 12px",
            borderRadius: 18,
            background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.12)",
            fontWeight: 900,
            minWidth: 86,
            textAlign: "center",
          }}>{dark ? "On" : "Off"}</div>
        </div>

        <div style={{ fontWeight: 900, marginBottom: 8 }}>Language</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {LANGS.map((l) => {
            const active = lang === l.id;
            const t = btn3d("#d0d0d0");
            return (
              <div key={l.id} role="button" tabIndex={0} onClick={() => setLang(l.id)} {...t} style={{
                ...t.style,
                padding: "10px 12px",
                borderRadius: 18,
                background: active ? "rgba(88,204,2,0.18)" : dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.92)",
                border: `2px solid ${active ? COLORS.accent : "rgba(0,0,0,0.12)"}`,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}><span>{l.flag}</span><span>{l.label}</span></div>
            );
          })}
        </div>
      </Card>

      <Card dark={dark} style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Account</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div role="button" tabIndex={0} onClick={resetAll} {...btn3d("rgba(0,0,0,0.14)")} style={{
            ...btn3d("rgba(0,0,0,0.14)").style,
            padding: "12px 12px",
            borderRadius: 18,
            background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.12)",
            fontWeight: 900,
            flex: 1,
            textAlign: "center",
          }}>Reset</div>

          <div role="button" tabIndex={0} onClick={logout} {...btn3d("rgba(140,0,0,0.45)")} style={{
            ...btn3d("rgba(140,0,0,0.45)").style,
            padding: "12px 12px",
            borderRadius: 18,
            background: COLORS.error,
            border: "1px solid rgba(0,0,0,0.12)",
            fontWeight: 900,
            color: "#fff",
            flex: 1,
            textAlign: "center",
          }}>Logout</div>
        </div>
      </Card>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: 12, background: dark ? "rgba(26,26,46,0.92)" : "rgba(255,255,255,0.92)", borderTop: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(8px)", zIndex: 65 }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <IconBtn icon="🏠" active={false} dark={dark} onClick={() => setPage("home")} />
          <IconBtn icon="🎯" active={false} dark={dark} onClick={() => setPage("goals")} />
          <IconBtn icon="👤" active={true} dark={dark} onClick={() => setPage("profile")} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- App ----------------------------------- */
const BUILD = 'alphabet-start-1';

function App() {
  useGlobalStyle();

  const [data, setData] = useState({ course: null, lessons: null, error: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('./data/course_min.json', { cache: 'no-store' });
        const scraped = await res.json();
        const built = buildCourseFromScraped(scraped);
        if (!alive) return;
        setData({ course: built.course, lessons: built.lessons, error: null });
      } catch (e) {
        if (!alive) return;
        setData({ course: null, lessons: null, error: String(e) });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const { flat, idx } = useMemo(() => {
    if (!data.course || !data.lessons) return { flat: [], idx: {} };
    return flattenCourse(data.course, data.lessons);
  }, [data.course, data.lessons]);

  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");
  const [user, setUser] = useState(null);

  const [page, setPage] = useState("welcome");
  const [authMode, setAuthMode] = useState("login");

  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [done, setDone] = useState([]);

  // Hearts are per-lesson but shown on Home top bar.
  const [hearts, setHearts] = useState(5);

  const [dailyGoal, setDailyGoal] = useState(20);
  const [dailyXp, setDailyXp] = useState(0);
  const [lastDay, setLastDay] = useState(todayKey());

  const [activeLessonId, setActiveLessonId] = useState(null);

  // persisted state
  useEffect(() => {
    (async () => {
      const s = await window.storage.get("state_react_v3");
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
      setActiveLessonId(s.activeLessonId || null);
    })();
  }, []);

  useEffect(() => {
    window.storage.set("state_react_v3", { dark, lang, user, xp, streak, done, dailyGoal, dailyXp, lastDay, page, activeLessonId });
  }, [dark, lang, user, xp, streak, done, dailyGoal, dailyXp, lastDay, page, activeLessonId]);

  useEffect(() => {
    const tk = todayKey();
    if (lastDay !== tk) {
      setLastDay(tk);
      setDailyXp(0);
    }
  }, [lastDay]);

  const bg = dark ? COLORS.bgDark : COLORS.bgLight;

  const startLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    setHearts(5);
    setPage("lesson");
  };

  // If data loaded and no active lesson selected yet, pick the first lesson.
  useEffect(() => {
    if (!activeLessonId && flat.length) {
      setActiveLessonId(flat[0].lesson.id);
    }
  }, [activeLessonId, flat.length]);

  const activeItem = activeLessonId && idx[activeLessonId] != null ? flat[idx[activeLessonId]] : null;
  const unitColor = activeItem?.unit?.color || COLORS.accent;

  const perSectionProgress = useMemo(() => {
    const counts = {
      beginnerA: { total: 0, done: 0, color: COLORS.beginner, title: "Beginner A" },
      beginnerB: { total: 0, done: 0, color: COLORS.beginner, title: "Beginner B" },
      intermediateA: { total: 0, done: 0, color: COLORS.intermediate, title: "Intermediate A" },
      intermediateB: { total: 0, done: 0, color: COLORS.intermediate, title: "Intermediate B" },
      advanced: { total: 0, done: 0, color: COLORS.advanced, title: "Advanced" },
    };
    flat.forEach((it) => {
      if (!counts[it.tierId]) return;
      counts[it.tierId].total += 1;
      if (done.includes(it.lesson.id)) counts[it.tierId].done += 1;
    });
    return Object.entries(counts).map(([id, v]) => ({ id, title: v.title, color: v.color, pct: v.total ? Math.round((v.done / v.total) * 100) : 0 }));
  }, [flat, done]);

  const resetAll = async () => {
    await window.storage.remove("state_react_v2");
    setDark(false);
    setLang("en");
    setUser(null);
    setXp(0);
    setStreak(1);
    setDone([]);
    setDailyGoal(20);
    setDailyXp(0);
    setLastDay(todayKey());
    setPage("welcome");
    setActiveLessonId(flat[0]?.lesson?.id || null);
    setHearts(5);
  };

  const logout = () => {
    setUser(null);
    setPage("welcome");
  };

  const completeLesson = () => {
    if (!activeItem) return;

    const id = activeItem.lesson.id;
    if (!done.includes(id)) setDone((d) => [...d, id]);

    const gained = Number(activeItem.lesson.xp || 10);
    setXp((x) => x + gained);
    setDailyXp((x) => x + gained);

    setStreak((s) => Math.max(1, s));

    const i = idx[id];
    const next = flat[i + 1]?.lesson?.id;
    if (next) {
      setActiveLessonId(next);
      setHearts(5);
      setPage("lesson");
    } else {
      setPage("home");
    }
  };

  const topChrome = page !== "welcome" ? (
    <div style={{ position: "sticky", top: 0, zIndex: 55, background: bg, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>Leshono <span style={{ fontWeight: 900, opacity: 0.45, fontSize: 12 }}>v{BUILD}</span></div>
        {/* dark mode toggle moved to Profile (per spec) */}
        <div style={{ fontWeight: 900, opacity: 0.55, fontSize: 12 }}> </div>
      </div>
    </div>
  ) : null;

  if (data.error) {
    return (
      <div style={{ minHeight: '100vh', background: bg, fontFamily: UI_FONT, padding: 16 }}>
        {topChrome}
        <Card dark={dark}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Failed to load course</div>
          <div style={{ fontWeight: 900, opacity: 0.75, lineHeight: 1.35 }}>{String(data.error)}</div>
        </Card>
      </div>
    );
  }

  if (!data.course || !data.lessons) {
    return (
      <div style={{ minHeight: '100vh', background: bg, fontFamily: UI_FONT, padding: 16 }}>
        {topChrome}
        <Card dark={dark}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Loading course…</div>
          <div style={{ fontWeight: 900, opacity: 0.75, lineHeight: 1.35 }}>Preparing lessons and exercises.</div>
        </Card>
      </div>
    );
  }

  const fg = dark ? COLORS.fgDark : COLORS.fgLight;

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

      {page === "home" ? (
        <PathView
          dark={dark}
          course={data.course}
          flat={flat}
          idx={idx}
          done={done}
          setDone={setDone}
          streak={streak}
          xp={xp}
          hearts={hearts}
          dailyGoal={dailyGoal}
          dailyXp={dailyXp}
          setPage={setPage}
          startLesson={startLesson}
        />
      ) : null}

      {page === "lesson" && activeItem ? (
        <div style={{ padding: 16, paddingBottom: 92 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{activeItem.lesson.title}</div>
            <Pill bg={dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"} fg={dark ? COLORS.fgDark : COLORS.fgLight}>❤️ {hearts}</Pill>
          </div>

          <LessonIntro
            lesson={activeItem.lesson}
            dark={dark}
            onStart={() => setPage("exercise")}
          />

          <div style={{ position: "fixed", left: 20, right: 20, bottom: 20, zIndex: 60, display: "flex", gap: 10 }}>
            <div role="button" tabIndex={0} onClick={() => setPage("home")} {...btn3d("rgba(0,0,0,0.14)")} style={{
              ...btn3d("rgba(0,0,0,0.14)").style,
              flex: 1,
              borderRadius: 18,
              padding: "14px 14px",
              textAlign: "center",
              fontWeight: 900,
              background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.12)",
              color: dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.70)",
            }}>Back</div>
            <div role="button" tabIndex={0} onClick={() => setPage("exercise")} {...btn3d(COLORS.accentShadow)} style={{
              ...btn3d(COLORS.accentShadow).style,
              flex: 1,
              borderRadius: 18,
              padding: "14px 14px",
              textAlign: "center",
              fontWeight: 900,
              background: COLORS.accent,
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#0b2a00",
            }}>Start Exercises</div>
          </div>
        </div>
      ) : null}

      {page === "exercise" && activeItem ? (
        <div style={{ padding: 16, paddingBottom: 92 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Exercises</div>
            <Pill bg={dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"} fg={dark ? COLORS.fgDark : COLORS.fgLight}>❤️ {hearts}</Pill>
          </div>
          <ExercisePage
            lesson={activeItem.lesson}
            dark={dark}
            unitColor={unitColor}
            hearts={hearts}
            setHearts={setHearts}
            onExit={() => setPage("home")}
            onDone={() => {
              setPage("complete");
            }}
          />
        </div>
      ) : null}

      {page === "complete" && activeItem ? (
        <div style={{ padding: 16, paddingBottom: 92 }}>
          <Confetti count={30} accent={unitColor} anim="cfall" seedKey={activeItem.lesson.id} />
          <Card dark={dark} style={{ textAlign: "center", padding: 18 }}>
            <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Lesson Complete!</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <Pill bg="rgba(28,176,246,0.14)" fg={COLORS.info}>XP {activeItem.lesson.xp || 10}</Pill>
              <Pill bg={dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"} fg={dark ? COLORS.fgDark : COLORS.fgLight}>❤️ {hearts}</Pill>
            </div>
            <div role="button" tabIndex={0} onClick={() => { completeLesson(); setPage("home"); }} {...btn3d(COLORS.accentShadow)} style={{
              ...btn3d(COLORS.accentShadow).style,
              background: COLORS.accent,
              color: "#0b2a00",
              borderRadius: 18,
              padding: "14px 14px",
              fontWeight: 900,
              border: "1px solid rgba(0,0,0,0.08)",
            }}>Continue</div>
          </Card>
        </div>
      ) : null}

      {page === "goals" ? (
        <GoalsPage
          dark={dark}
          dailyGoal={dailyGoal}
          dailyXp={dailyXp}
          setDailyGoal={setDailyGoal}
          streak={streak}
          setPage={setPage}
        />
      ) : null}

      {page === "profile" ? (
        <ProfilePage
          dark={dark}
          setDark={setDark}
          lang={lang}
          setLang={setLang}
          user={user}
          setUser={setUser}
          xp={xp}
          streak={streak}
          doneCount={done.length}
          perSectionProgress={perSectionProgress}
          resetAll={resetAll}
          logout={logout}
          setPage={setPage}
        />
      ) : null}
    </div>
  );
}

// Export global for index.html
window.App = App;
