import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { ChurchStoreData } from './src/types.js';
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
} from './src/lib/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));

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
        store = { ...store, ...parsed };
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
    // 1. Get latest commit SHA of target branch (or initialize repository if it is brand new / empty)
    let latestCommitSha = '';
    const refRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/ref/heads/${branch}`, { headers });

    if (refRes.ok) {
      const refData = (await refRes.json()) as { object: { sha: string } };
      latestCommitSha = refData.object.sha;
    } else {
      // Repository might be completely empty (409 Conflict: Git Repository is empty) or branch doesn't exist yet
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

    // 2. Collect all project files and create tree
    const files = getProjectFiles(__dirname);
    const tree = files.map((file) => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content,
    }));

    const createTreeRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tree,
      }),
    });

    if (!createTreeRes.ok) {
      const errText = await createTreeRes.text();
      return res.status(createTreeRes.status).json({
        success: false,
        message: `Erro ao criar árvore de arquivos no GitHub: ${errText}`,
      });
    }

    const treeData = (await createTreeRes.json()) as { sha: string };

    // 3. Create Commit
    const createCommitRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage || 'Atualização completa: Sistema IEQ VILA ANDREZA (Igreja do Evangelho Quadrangular)',
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    });

    if (!createCommitRes.ok) {
      const errText = await createCommitRes.text();
      return res.status(createCommitRes.status).json({
        success: false,
        message: `Erro ao criar commit no GitHub: ${errText}`,
      });
    }

    const commitData = (await createCommitRes.json()) as { sha: string; html_url?: string };

    // 4. Update Branch Reference
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
