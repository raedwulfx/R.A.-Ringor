import { createClient } from '@supabase/supabase-js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitStore = new Map();
let knowledgeCache = { data: null, expiresAt: 0 };

async function parseJsonBody(req) {
  if (req.body !== undefined) {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) {
    return {};
  }

  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getClientId(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';
  const sessionId = req.headers['x-session-id'] || req.headers['x-chat-session'] || ip;
  return `${sessionId}`;
}

function isRateAllowed(clientId) {
  const now = Date.now();
  const existing = rateLimitStore.get(clientId);

  if (!existing) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (existing.resetAt <= now) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  existing.count += 1;
  return true;
}

function buildKnowledgePrompt(projects, certificates) {
  const projectLines = projects.map((project, index) => {
    const title = project.Title || project.title || project.name || `Project ${index + 1}`;
    const description = project.Description || project.description || '';
    const techStack = Array.isArray(project.TechStack)
      ? project.TechStack.join(', ')
      : project.TechStack || '';
    const link = project.Link || project.link || '';
    const github = project.Github || project.github || '';

    const details = [
      description ? `Description: ${description}` : '',
      techStack ? `Tech stack: ${techStack}` : '',
      link ? `Link: ${link}` : '',
      github ? `GitHub: ${github}` : ''
    ].filter(Boolean);

    return `- ${title}${details.length ? `\n  ${details.join('\n  ')}` : ''}`;
  });

  const certificateLines = certificates.map((certificate, index) => {
    const label = certificate.Title || certificate.title || `Certification ${index + 1}`;
    const image = certificate.Img || certificate.img || '';
    return image ? `- ${label}: ${image}` : `- ${label}`;
  });

  return [
    'You are the AI assistant for Rogelio\'s portfolio website.',
    'Use only the portfolio data below to answer questions.',
    'Only discuss Rogelio, his projects, skills, and certifications.',
    'Keep answers concise, friendly, and helpful.',
    'If the user asks something outside this scope, politely redirect them back to the portfolio.',
    'Never invent projects, links, certifications, or technical details that are not in the provided data.',
    '',
    'Portfolio data:',
    'Projects:',
    projectLines.join('\n') || '- No projects found.',
    '',
    'Certifications:',
    certificateLines.join('\n') || '- No certifications found.'
  ].join('\n');
}

async function getPortfolioKnowledge() {
  const now = Date.now();

  if (knowledgeCache.data && knowledgeCache.expiresAt > now) {
    return knowledgeCache.data;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role credentials are not configured.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const [projectsResult, certificatesResult] = await Promise.all([
    supabase.from('projects').select('*').order('id', { ascending: true }),
    supabase.from('certificates').select('*').order('id', { ascending: true })
  ]);

  if (projectsResult.error) {
    throw projectsResult.error;
  }

  if (certificatesResult.error) {
    throw certificatesResult.error;
  }

  const data = {
    projects: projectsResult.data || [],
    certificates: certificatesResult.data || []
  };

  knowledgeCache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = getClientId(req);
  if (!isRateAllowed(clientId)) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }

  const body = await parseJsonBody(req);
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const history = Array.isArray(body.history) ? body.history : [];

  if (!message) {
    return res.status(400).json({ error: 'A message is required.' });
  }

  try {
    const { projects, certificates } = await getPortfolioKnowledge();
    const systemPrompt = buildKnowledgePrompt(projects, certificates);

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      ...history.map((entry) => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content || '' }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 220
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini request failed.');
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I can help with your portfolio questions.';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: error.message || 'Unable to answer right now.' });
  }
}
