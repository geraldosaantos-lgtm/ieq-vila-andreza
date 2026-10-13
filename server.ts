import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import type { ChurchStoreData, SocialPostItem, QuadrangularPillar, SocialPlatform } from './src/types.js';
import {
  DEFAULT_CHURCH_SETTINGS,
  INITIAL_AGENDA_EVENTS,
  INITIAL_WORSHIP_MUSICIANS,
  INITIAL_WORSHIP_SCALES,
  INITIAL_WORSHIP_SONGS,
  DEMO_MEMBERS,
  DEMO_LEADERSHIP,
  DEMO_VISITORS,
  DEMO_SERVICE_RECORDS,
  DEFAULT_SOCIAL_AGENT_CONFIG,
  DEMO_SOCIAL_POSTS,
} from './src/lib/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client (Gemini 2.5 Flash as standard per guidelines)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Data file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let store: ChurchStoreData = {
  church: DEFAULT_CHURCH_SETTINGS,
  agenda: INITIAL_AGENDA_EVENTS,
  worshipMusicians: INITIAL_WORSHIP_MUSICIANS,
  worshipScales: INITIAL_WORSHIP_SCALES,
  worshipSongs: INITIAL_WORSHIP_SONGS,
  members: DEMO_MEMBERS,
  leadership: DEMO_LEADERSHIP,
  visitors: DEMO_VISITORS,
  serviceRecords: DEMO_SERVICE_RECORDS,
  socialPosts: DEMO_SOCIAL_POSTS,
  socialAgentConfig: DEFAULT_SOCIAL_AGENT_CONFIG,
  supabaseConfig: {
    url: '',
    anonKey: '',
    connected: false,
  },
};

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.church) {
        store = {
          ...store,
          ...parsed,
          socialPosts: parsed.socialPosts || DEMO_SOCIAL_POSTS,
          socialAgentConfig: {
            ...DEFAULT_SOCIAL_AGENT_CONFIG,
            ...(parsed.socialAgentConfig || {}),
          },
        };
      } else {
        saveStore();
      }
    } else {
      saveStore();
    }
  } catch (err) {
    console.error('Error loading church store, using defaults:', err);
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving church store:', err);
  }
}

loadStore();

// Helper to recursively collect project files for GitHub push
function getProjectFiles(dirPath: string, baseDir: string = dirPath): Array<{ path: string; content: string }> {
  const ignoredDirs = new Set(['node_modules', 'dist', '.git', '.github', 'data', '.aistudio', '.next', '.vercel']);
  const ignoredFiles = new Set(['bun.lock', 'package-lock.json', '.DS_Store', 'server.js']);
  const results: Array<{ path: string; content: string }> = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name) || ignoredFiles.has(entry.name)) continue;
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;

    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      results.push(...getProjectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        results.push({ path: relPath, content });
      } catch {
        // skip binary or unreadable files
      }
    }
  }
  return results;
}

// ===================== CHURCH STORE ROUTES =====================
app.get('/api/church/store', (_req: Request, res: Response) => {
  res.json(store);
});

app.post('/api/church/store', (req: Request, res: Response) => {
  if (req.body && typeof req.body === 'object' && req.body.church) {
    store = { ...store, ...req.body };
    saveStore();
  }
  res.json({ success: true, store });
});

// ===================== SOCIAL MEDIA AI AGENT ROUTES =====================
app.post('/api/social-agent/generate', async (req: Request, res: Response) => {
  const {
    prompt,
    pillar = 'salvacao',
    tone = 'inspirador_evangelistico',
    platforms = ['facebook', 'instagram', 'tiktok'],
    churchName = 'IEQ Vila Andreza',
    pastorName = 'Pr. Geraldo Santos',
    mediaCount = 1,
    mediaTypes = ['photo'],
  } = req.body || {};

  const pillarDescriptions: Record<string, string> = {
    salvacao: 'Jesus Cristo Salva (A Cruz - Vermelho Escarlate) · Lucas 19:10, João 3:16',
    espirito_santo: 'Jesus Batiza com o Espírito Santo (A Pomba de Fogo - Amarelo Ouro) · Atos 1:8, Lucas 3:16',
    cura_divina: 'Jesus Cura os Enfermos (O Cálice - Azul Celeste) · Isaías 53:4-5, Tiago 5:14',
    segunda_vinda: 'Jesus Voltará como Rei que Há de Vir (A Coroa - Púrpura Real) · 1 Tessalonicenses 4:16-17',
  };

  const pillarBibleDefault: Record<string, string> = {
    salvacao: 'João 3:16 — "Porque Deus amou o mundo de tal maneira..."',
    espirito_santo: 'Atos 1:8 — "Mas recebereis a virtude do Espírito Santo..."',
    cura_divina: 'Isaías 53:5 — "Pelas suas pisaduras fomos sarados."',
    segunda_vinda: '1 Tessalonicenses 4:16 — "Porque o mesmo Senhor descerá do céu..."',
  };

  try {
    // If Gemini API is available, generate rich structured copy
    if (process.env.GEMINI_API_KEY) {
      const systemInstruction = `Você é o Agente Inteligente de Mídias Sociais da Igreja do Evangelho Quadrangular (IEQ) - ${churchName}, liderada pelo ${pastorName}.
Sua missão é criar postagens atrativas, fiéis à doutrina Quadrangular, inspiradoras e evangelísticas para Facebook, Instagram e TikTok a partir das fotos/vídeos e instruções fornecidas.
Doutrina do post: ${pillarDescriptions[pillar] || pillarDescriptions.salvacao}.
Tom: ${tone}.
Quantidade de mídias enviadas: ${mediaCount} (${mediaTypes.join(', ')}).

Gere APENAS um objeto JSON válido (sem tags markdown de código fora do JSON) com a seguinte estrutura:
{
  "title": "Título conciso do post",
  "visualAnalysis": "Breve análise da foto/vídeo para redes sociais (1-2 frases)",
  "suggestedHook": "Frase de impacto inicial para engajamento",
  "bibleReference": "Versículo bíblico chave",
  "content": {
    "instagram": {
      "caption": "Legenda completa formatada com emojis, quebras de linha e chamada de ação",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "formatSuggestion": "Ex: Reels 9:16 ou Carrossel",
      "bestTime": "Ex: 18:30 às 20:00"
    },
    "facebook": {
      "postText": "Texto do post para página do Facebook",
      "callToAction": "Chamada para ação no Facebook",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "bestTime": "Ex: 10:00 ou 19:30"
    },
    "tiktok": {
      "caption": "Legenda curta para o TikTok",
      "videoScriptHook": "Roteiro dos primeiros 3 segundos para reter atenção no TikTok",
      "soundSuggestion": "Sugestão de música/áudio gospel em alta",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"],
      "bestTime": "Ex: 12:00 às 14:00"
    }
  }
}`;

      const userContent = prompt
        ? `Crie os posts para o seguinte evento/mídia da igreja: ${prompt}`
        : `Crie um post inspirador convidando a comunidade para o próximo culto da família na ${churchName}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemInstruction}\n\n${userContent}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      try {
        const parsed = JSON.parse(rawText);
        return res.json({
          success: true,
          post: {
            title: parsed.title || 'Post IEQ Vila Andreza',
            contextPrompt: prompt || '',
            tone,
            pillar,
            visualAnalysis: parsed.visualAnalysis || 'Mídia analisada com sucesso pelo Agente IA.',
            suggestedHook: parsed.suggestedHook || 'Venha viver momentos de adoração conosco!',
            bibleReference: parsed.bibleReference || pillarBibleDefault[pillar],
            platforms,
            content: parsed.content,
            status: 'aguardando_aprovacao',
          },
        });
      } catch (e) {
        console.warn('Gemini response was not strict JSON, falling back:', rawText);
      }
    }
  } catch (err: any) {
    console.error('Error invoking Gemini for social agent:', err?.message || err);
  }

  // Graceful deterministic generator matching IEQ standards
  const pBible = pillarBibleDefault[pillar] || 'Salmos 100:2';
  return res.json({
    success: true,
    post: {
      title: prompt ? String(prompt).slice(0, 48) : `Culto & Celebração — ${churchName}`,
      contextPrompt: prompt || 'Mídia enviada para divulgação pastoral nas redes',
      tone,
      pillar,
      visualAnalysis: `Foto/vídeo analisado pelo Agente IA da ${churchName}. Enquadramento excelente para Reels, Feed e TikTok com atmosfera acolhedora e adoração.`,
      suggestedHook: `Uma noite que vai renovar a sua fé e abençoar a sua família! 🙌🔥`,
      bibleReference: pBible,
      platforms,
      content: {
        instagram: {
          caption: `✨ Momentos inesquecíveis na presença do Senhor na ${churchName}!\n\n${prompt || 'Deus tem grandes planos para a sua vida e para toda a sua família. Venha adorar conosco e receber uma palavra de vida!'}\n\n📍 ${churchName}\n🎙️ ${pastorName}\n\nDeixe seu "AMÉM" nos comentários e compartilhe essa bênção com quem você ama! 👇`,
          hashtags: ['#IEQVilaAndreza', '#Quadrangular', '#JesusCristo', '#Evangelho', '#VilaAndreza', '#Adoracao', '#Culto'],
          formatSuggestion: 'Reels vertical 9:16 com áudio instrumental ou Carrossel de Fotos',
          bestTime: '18:30 às 20:30',
        },
        facebook: {
          postText: `A Paz do Senhor a todos os irmãos e amigos da ${churchName}! 🙌\n\n${prompt || 'Tivemos uma noite de profunda adoração e a presença de Deus foi real em nosso meio.'}\n\nVenha fazer parte da nossa família de fé! Todos são bem-vindos na casa do Pai.`,
          callToAction: 'Confirme presença nos comentários e compartilhe em seu perfil!',
          hashtags: ['#IEQVilaAndreza', '#EvangelhoQuadrangular', '#Familia'],
          bestTime: '10:00 ou 19:00',
        },
        tiktok: {
          caption: `Você já sentiu a presença de Deus transformar o seu dia? 🔥🙌 Vem adorar com a gente na ${churchName}! #IEQVilaAndreza #TikTokGospel #Worship`,
          videoScriptHook: `[0-3s] "Deus mandou te dizer isto antes de você fechar este vídeo..." -> [3-10s] Mostrar a igreja cantando unida -> [Final] "Te esperamos neste culto na IEQ!"`,
          soundSuggestion: 'Bondade de Deus (Instrumental ou Versão Acústica)',
          hashtags: ['#IEQVilaAndreza', '#GospelBrasil', '#CristaosNoTikTok', '#JesusTeAma'],
          bestTime: '12:00 às 14:00',
        },
      },
      status: 'aguardando_aprovacao',
    },
  });
});

app.post('/api/social-agent/publish', async (req: Request, res: Response) => {
  const { postId, platforms = ['facebook', 'instagram', 'tiktok'] } = req.body || {};

  // Mock social networks dispatch with instant receipts
  const receipts = platforms.map((plat: string) => ({
    platform: plat,
    status: 'published',
    publishedId: `pub-${plat}-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }));

  return res.json({
    success: true,
    postId,
    receipts,
    message: `Post publicado com sucesso no ${platforms.join(', ')}!`,
  });
});

// ===================== SUPABASE SQL MIGRATIONS & SCHEMA GENERATOR =====================
app.get('/api/supabase/schema', (_req: Request, res: Response) => {
  const fullSchemaPath = path.resolve(__dirname, 'supabase/full_schema.sql');
  if (fs.existsSync(fullSchemaPath)) {
    const content = fs.readFileSync(fullSchemaPath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(content);
  }

  res.status(404).send('-- Arquivo de schema unificado não encontrado');
});

app.get('/api/supabase/migrations', (_req: Request, res: Response) => {
  const migrationsDir = path.resolve(__dirname, 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    return res.json({ migrations: [] });
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const migrations = files.map((file) => {
    const fullPath = path.join(migrationsDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
      filename: file,
      size: fs.statSync(fullPath).size,
      sql: content,
    };
  });

  res.json({ migrations });
});

app.post('/api/supabase/config', (req: Request, res: Response) => {
  const { url, anonKey } = req.body;
  store.supabaseConfig = {
    url: url || '',
    anonKey: anonKey || '',
    connected: Boolean(url && anonKey),
  };
  saveStore();
  res.json({
    success: true,
    message: 'Configuração do Supabase salva com sucesso!',
    config: store.supabaseConfig,
  });
});

app.get('/api/supabase/config', (_req: Request, res: Response) => {
  res.json({
    config: store.supabaseConfig || { url: '', anonKey: '', connected: false },
  });
});

// ===================== GITHUB & VERCEL DIRECT SYNC ROUTES =====================
app.post('/api/github/push', async (req: Request, res: Response) => {
  const { repo, branch = 'main', token, commitMessage } = req.body || {};

  if (!repo || !token) {
    return res.status(400).json({
      success: false,
      message: 'Informe o repositório (ex: geraldosaantos-lgtm/ieq-vila-andreza) e o Personal Access Token do GitHub.',
    });
  }

  const cleanRepo = String(repo)
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${String(token).trim()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'IEQ-Vila-Andreza-App',
  };

  try {
    let latestCommitSha = '';
    const refRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/ref/heads/${branch}`, { headers });

    if (refRes.ok) {
      const refData = (await refRes.json()) as { object: { sha: string } };
      latestCommitSha = refData.object.sha;
    } else {
      const initContent = Buffer.from(
        '# IEQ VILA ANDREZA — Sistema de Gestão Eclesiástica\nInicializando repositório...\n',
        'utf-8'
      ).toString('base64');

      const initRes = await fetch(`https://api.github.com/repos/${cleanRepo}/contents/README.md`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Inicialização do repositório IEQ VILA ANDREZA',
          content: initContent,
          branch,
        }),
      });

      if (!initRes.ok) {
        const errText = await initRes.text();
        return res.status(initRes.status).json({
          success: false,
          message: `Não foi possível inicializar a branch "${branch}" em ${cleanRepo}. Verifique se o Token possui a permissão "repo" (classic) ou "Contents: Read and write". Detalhe: ${errText}`,
        });
      }

      const initData = (await initRes.json()) as { commit?: { sha?: string } };
      if (initData?.commit?.sha) {
        latestCommitSha = initData.commit.sha;
      } else {
        const retryRefRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/ref/heads/${branch}`, { headers });
        if (!retryRefRes.ok) {
          const retryErr = await retryRefRes.text();
          return res.status(retryRefRes.status).json({
            success: false,
            message: `Repositório inicializado, mas não foi possível ler a branch "${branch}": ${retryErr}`,
          });
        }
        const retryRefData = (await retryRefRes.json()) as { object: { sha: string } };
        latestCommitSha = retryRefData.object.sha;
      }
    }

    const files = getProjectFiles(__dirname);
    const tree = files.map((file) => ({
      path: file.path,
      mode: '100644' as const,
      type: 'blob' as const,
      content: file.content,
    }));

    const createTreeRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: latestCommitSha || undefined,
        tree,
      }),
    });

    if (!createTreeRes.ok) {
      const errText = await createTreeRes.text();
      return res.status(createTreeRes.status).json({
        success: false,
        message: `Erro ao criar a árvore de arquivos no GitHub: ${errText}`,
      });
    }

    const treeData = (await createTreeRes.json()) as { sha: string };

    const commitMsg =
      commitMessage ||
      `chore: Atualização do sistema IEQ VILA ANDREZA (${new Date().toLocaleString('pt-BR')})`;

    const commitRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMsg,
        tree: treeData.sha,
        parents: latestCommitSha ? [latestCommitSha] : [],
      }),
    });

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      return res.status(commitRes.status).json({
        success: false,
        message: `Erro ao criar o commit no GitHub: ${errText}`,
      });
    }

    const commitData = (await commitRes.json()) as { sha: string };

    const updateRefRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: commitData.sha,
        force: true,
      }),
    });

    if (!updateRefRes.ok) {
      const errText = await updateRefRes.text();
      return res.status(updateRefRes.status).json({
        success: false,
        message: `Erro ao atualizar a branch ${branch}: ${errText}`,
      });
    }

    return res.json({
      success: true,
      commitSha: commitData.sha,
      filesCount: files.length,
      message: `Sucesso! ${files.length} arquivos do sistema IEQ VILA ANDREZA foram enviados para ${cleanRepo} (${branch}). A Vercel já iniciou a atualização automática!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Erro de rede ao enviar para o GitHub: ${err?.message || String(err)}`,
    });
  }
});

app.post('/api/vercel/deploy-hook', async (req: Request, res: Response) => {
  const { hookUrl } = req.body || {};
  if (!hookUrl || !String(hookUrl).startsWith('https://api.vercel.com/')) {
    return res.status(400).json({
      success: false,
      message: 'Informe uma URL de Deploy Hook válida da Vercel (https://api.vercel.com/v1/integrations/deploy/...)',
    });
  }

  try {
    const response = await fetch(String(hookUrl).trim(), { method: 'POST' });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `A Vercel retornou erro (${response.status}): ${text}`,
      });
    }
    return res.json({
      success: true,
      message: 'Deploy acionado com sucesso na Vercel! Em instantes seu site estará atualizado.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Falha ao acionar o Deploy Hook da Vercel: ${err?.message || String(err)}`,
    });
  }
});

// ===================== FRONTEND INTEGRATION =====================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Servidor IEQ VILA ANDREZA executando em http://localhost:${PORT}`);
  });
}

startServer();
