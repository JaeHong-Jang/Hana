import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as api from './server/api';

// 뒷단을 개발 서버에 함께 올린다. 주소는 /api/*, 주소 표는 server/api.ts
// 상태는 파일에 적어 두어 서버가 다시 떠도 이어진다. 프로젝트 폴더 밖에 두어 파일 감시에 걸리지 않게 한다.
const FILE = join(tmpdir(), 'irp-guide', 'state.json');
const save = () => {
  mkdirSync(join(tmpdir(), 'irp-guide'), { recursive: true });
  writeFileSync(FILE, api.dump());
};
try {
  if (existsSync(FILE)) api.restore(readFileSync(FILE, 'utf8'));
} catch {
  api.reset();
}

function server(): Plugin {
  const handle = (req: any, res: any, next: () => void) => {
    const name = (req.url as string).split('?')[0].replace(/^\//, '');
    const send = (code: number, body: unknown) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(body));
    };
    if (req.method === 'GET' && name === 'state') return send(200, api.view());
    if (req.method !== 'POST' || !api.has(name)) return next();
    let raw = '';
    req.on('data', (c: Buffer) => (raw += c));
    req.on('end', () => {
      try {
        api.run(name, raw ? JSON.parse(raw) : {});
        save();
        send(200, api.view());
      } catch (e) {
        send(400, { ...api.view(), error: e instanceof Error ? e.message : '처리하지 못했어요.' });
      }
    });
  };
  return {
    name: 'irp-guide-api',
    configureServer: (srv) => void srv.middlewares.use('/api', handle),
    configurePreviewServer: (srv) => void srv.middlewares.use('/api', handle),
  };
}

export default defineConfig({
  plugins: [react(), server()],
  base: './',
  // WSL에서 윈도우 폴더(/mnt/c)는 파일 바뀜을 못 알아채므로 주기적으로 확인한다
  server: { port: 5173, host: true, watch: { usePolling: true, interval: 500 } },
});
