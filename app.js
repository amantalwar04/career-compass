/* ===========================
   Career Compass — App Logic
   =========================== */

'use strict';

// ── State ──────────────────────────────────────────────
let selectedPostType = 'post';

// ── Tab Navigation ─────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  document.getElementById('tab-' + tab).classList.add('active');
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
}

// ── Skill Tags ──────────────────────────────────────────
function toggleSkill(el) {
  el.classList.toggle('selected');
  el.setAttribute('aria-pressed', el.classList.contains('selected'));
}

// ── Name Sync ───────────────────────────────────────────
function updateName() {
  const n = document.getElementById('user-name').value.trim();
  const first = n.split(' ')[0] || 'A';
  const av = document.getElementById('post-avatar');
  const pn = document.getElementById('post-name');
  if (av) av.textContent = first[0].toUpperCase();
  if (pn) pn.textContent = n || 'Your Name';
}

// ── Profile Helper ──────────────────────────────────────
function getProfile() {
  return {
    name:     document.getElementById('user-name').value.trim()    || 'professional',
    title:    document.getElementById('current-title').value.trim() || 'a professional',
    industry: document.getElementById('industry').value            || 'their industry',
    exp:      document.getElementById('experience').value          || '',
    target:   document.getElementById('target-role').value.trim()  || 'a senior role',
    goal:     document.getElementById('career-goal').value.trim()  || '',
    skills:   [...document.querySelectorAll('.skill-tag.selected')]
                .map(el => el.textContent.trim()).join(', ')        || 'various skills',
  };
}

// ── Claude API Call ─────────────────────────────────────
async function callClaude(prompt, outputEl, boxEl) {
  boxEl.classList.add('visible');
  outputEl.innerHTML = '<span class="spinner" aria-hidden="true"></span>Thinking…';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.map(b => b.text || '').join('') || 'No response generated.';
    outputEl.textContent = text;
  } catch (e) {
    outputEl.textContent = `⚠️ ${e.message || 'Something went wrong. Please try again.'}`;
  }
}

// ── Profile Analysis ────────────────────────────────────
function analyzeProfile() {
  const p = getProfile();
  const prompt = `You are a world-class career coach. Analyze this professional profile and give 3–4 specific, actionable insights in a warm but direct tone.

Name: ${p.name}
Current role: ${p.title}
Industry: ${p.industry}
Experience: ${p.exp}
Target role: ${p.target}
Key skills: ${p.skills}
Career goal: ${p.goal}

Give: (1) Biggest strength to leverage, (2) Biggest gap to address, (3) One non-obvious opportunity, (4) First concrete step to take this week. Be specific and motivating. Keep it under 220 words.`;

  callClaude(
    prompt,
    document.getElementById('profile-ai-content'),
    document.getElementById('profile-ai-box')
  );
}

// ── Opportunity AI Advice ────────────────────────────────
function getAIAdvice(role) {
  const p = getProfile();
  const prompt = `Career coaching advice for ${p.name} who is a ${p.title} with ${p.exp} experience, targeting the role: ${role}.

Give 3 specific tips: (1) How to position their background for this role, (2) What skill or credential to highlight or fast-track, (3) How to approach networking for this specific opportunity. Be practical and specific. Max 200 words.`;

  callClaude(
    prompt,
    document.getElementById('opps-ai-content'),
    document.getElementById('opps-ai-box')
  );
}

function refreshOpps() {
  alert('Complete your profile to get dynamically matched opportunities!');
}

// ── Post Type Selection ──────────────────────────────────
function selectPostType(el, type) {
  document.querySelectorAll('.post-type-card').forEach(c => {
    c.classList.remove('selected');
    c.setAttribute('aria-pressed', 'false');
  });
  el.classList.add('selected');
  el.setAttribute('aria-pressed', 'true');
  selectedPostType = type;
}

// ── LinkedIn Content Generator ───────────────────────────
async function generatePost() {
  const p       = getProfile();
  const topic   = document.getElementById('post-topic').value.trim();
  const box     = document.getElementById('generated-post');
  const content = document.getElementById('post-content');
  const hashes  = document.getElementById('post-hashtags');

  const typeDescriptions = {
    post:       'a compelling 150–180 word LinkedIn post with a strong hook, personal insight, and a closing question to drive comments. Use line breaks for readability. Add 4–5 relevant hashtags on a new line at the end, each starting with #.',
    article:    'a LinkedIn article outline with a punchy headline, a 4-section structure, and the first 150 words of the intro. Make it thought-leadership quality.',
    newsletter: 'a LinkedIn newsletter edition intro (180 words): a personal opening, the theme of the week, and a teaser for 3 topics covered. Start with a compelling subject line on its own line.',
    carousel:   'a carousel script — Slide 1: a bold hook statement (8–12 words, impossible to scroll past). Slides 2–6: one punchy insight each (10–15 words per slide). Label each slide clearly.',
  };

  const prompt = `You are a LinkedIn content strategist. Write ${typeDescriptions[selectedPostType] || typeDescriptions.post}

Author profile: ${p.title} in ${p.industry}, ${p.exp} experience, skills: ${p.skills}. Target audience: people interested in ${p.target}.
${topic ? `Topic/angle: ${topic}` : 'Choose the most compelling topic given this profile.'}

Write in a human, conversational voice. Avoid clichés like "I'm excited to share", "In today's world", or "As we navigate". Make it feel real and lived-in.`;

  box.classList.add('visible');
  content.textContent = '⏳ Crafting your post…';
  hashes.innerHTML = '';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.map(b => b.text || '').join('') || '';

    // Separate hashtags from body
    const lines = text.split('\n');
    const hashLines   = lines.filter(l => /^#\w/.test(l.trim()));
    const bodyLines   = lines.filter(l => !/^#\w/.test(l.trim()));
    content.textContent = bodyLines.join('\n').trim();

    // Render hashtags
    const allTags = hashLines.join(' ').match(/#\w+/g) || [];
    allTags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'post-tag';
      span.textContent = tag + ' ';
      hashes.appendChild(span);
    });
  } catch (e) {
    content.textContent = '⚠️ Could not generate content. Please try again.';
  }
}

// ── Copy Post ────────────────────────────────────────────
function copyPost() {
  const text = document.getElementById('post-content').textContent;
  const tags  = [...document.querySelectorAll('.post-tag')].map(s => s.textContent.trim()).join(' ');
  const btn   = document.querySelector('.copy-btn');

  navigator.clipboard.writeText(text + (tags ? '\n\n' + tags : '')).then(() => {
    btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied!';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i> Copy';
    }, 2000);
  }).catch(() => {
    btn.textContent = 'Failed';
  });
}

// ── Nudge Done Toggle ────────────────────────────────────
function markDone(btn) {
  btn.classList.toggle('completed');
  btn.textContent = btn.classList.contains('completed') ? '✓ Done!' : '✓ Done';
  btn.setAttribute('aria-pressed', btn.classList.contains('completed'));
}

// ── Weekly Plan Generator ────────────────────────────────
function generateWeeklyPlan() {
  const p = getProfile();
  const prompt = `Create a personalized 5-day LinkedIn and career growth plan for ${p.name}, a ${p.title} in ${p.industry} aiming to become ${p.target}.

Format clearly: Monday through Friday. Each day: (1) one specific LinkedIn action — give the exact post type and topic angle, not generic advice; (2) one career move — outreach target, resource to study, or application to submit. Keep each day to 2–3 sentences. Total under 250 words.`;

  callClaude(
    prompt,
    document.getElementById('planner-ai-content'),
    document.getElementById('planner-ai-box')
  );
}

// ── Growth Tips ──────────────────────────────────────────
function getGrowthTips() {
  const p = getProfile();
  const prompt = `You are a LinkedIn growth coach. Based on this profile, give 3 ultra-specific growth priorities ranked by impact:

Profile: ${p.title}, ${p.industry}, ${p.exp}, targeting ${p.target}.

For each priority: (1) Exactly what to do, (2) Why it moves the needle, (3) How to execute it in under 20 minutes this week. Be direct, no fluff. Max 220 words.`;

  callClaude(
    prompt,
    document.getElementById('score-ai-content'),
    document.getElementById('score-ai-box')
  );
}

// ── Week Calendar Builder ────────────────────────────────
function buildWeekGrid() {
  const grid    = document.getElementById('week-grid');
  if (!grid) return;
  const days    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today   = new Date();
  const taskDays = [1, 3, 4, 5]; // Mon, Wed, Thu, Fri

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);

    const isToday   = i === today.getDay();
    const hasTask   = taskDays.includes(i);

    const cell = document.createElement('div');
    cell.className = 'day-cell' + (isToday ? ' today' : '') + (hasTask ? ' has-task' : '');
    cell.setAttribute('aria-label', `${days[i]} ${d.getDate()}${hasTask ? ' — task scheduled' : ''}`);
    cell.innerHTML =
      `<div class="day-name">${days[i]}</div>` +
      `<div class="day-num">${d.getDate()}</div>` +
      `<div class="day-dot"></div>`;
    grid.appendChild(cell);
  }
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildWeekGrid();

  // Add aria-pressed to skill tags
  document.querySelectorAll('.skill-tag').forEach(btn => {
    btn.setAttribute('aria-pressed', 'false');
  });
  // Add aria-pressed to post type cards
  document.querySelectorAll('.post-type-card').forEach(btn => {
    btn.setAttribute('aria-pressed', 'false');
  });
});
