import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import * as core from './server/core';

// 뒷단을 개발 서버에 함께 올린다. 주소는 /api/*, 본체는 server/core.ts
const routes: Record<string, (b: any) => unknown> = {
  trade: () => core.trade(),
  later: (b) => core.later(b.id),
  ask: (b) => core.ask(String(b.text ?? '').slice(0, 200)),
  approve: (b) => core.approve(b.id),
  dismiss: (b) => core.dismiss(b.id),
  status: (b) => core.setStatus(b.id, b.to, '손님'), // 화면에서 직접 누른 것은 언제나 손님이다
  undo: (b) => core.undo(b.id),
  keep: (b) => core.keep(b.id),
  open: (b) => core.openService(b.id),
  rule: (b) => core.setRule(b),
  advance: (b) => core.advance(Number(b.days) || 0),
  reset: () => core.reset(),
};

function api(): Plugin {
  const handle = (req: any, res: any, next: () => void) => {
    const name = (req.url as string).split('?')[0].replace(/^\//, '');
    const send = (code: number, body: unknown) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(body));
    };
    if (req.method === 'GET' && name === 'state') return send(200, core.view());
    if (req.method !== 'POST' || !routes[name]) return next();
    let raw = '';
    req.on('data', (c: Buffer) => (raw += c));
    req.on('end', () => {
      try {
        routes[name](raw ? JSON.parse(raw) : {});
        send(200, core.view());
      } catch (e) {
        send(400, { ...core.view(), error: e instanceof Error ? e.message : '처리하지 못했어요.' });
      }
    });
  };
  return {
    name: 'fee-assistant-api',
    configureServer: (server) => void server.middlewares.use('/api', handle),
    configurePreviewServer: (server) => void server.middlewares.use('/api', handle),
  };
}

export default defineConfig({
  plugins: [react(), api()],
  base: './',
  // WSL에서 윈도우 폴더(/mnt/c)는 파일 바뀜을 못 알아채므로 주기적으로 확인한다
  server: { port: 5173, host: true, watch: { usePolling: true, interval: 500 } },
});
