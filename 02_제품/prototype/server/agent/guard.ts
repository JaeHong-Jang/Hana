// 검사. 들어온 말이 길잡이 권한 밖인지 가리고, 나가는 답에 도구가 셈하지 않은 금액이 섞였는지 본다.
import type { Block } from '../store';

export type Gate = 'ok' | 'invest' | 'execute';
export const GATE_NAME: Record<Gate, string> = {
  ok: '권한 안의 물음',
  invest: '상품·운용·대출 부탁 (하지 않는 일)',
  execute: '대신 실행해 달라는 부탁 (할 수 없는 일)',
};
export function gate(text: string): Gate {
  if (/뭐 ?사|종목|펀드|etf|운용해|상품|추천|대출 ?(받|해|알아)/i.test(text)) return 'invest';
  if (/(해지|개설|이체|송금|제출|신청|매수|매도|가입)\s*(좀\s*)?(해|시켜)\s*(줘|주세요|줄래|줄 수)|대신\s*(내|열|해지|제출|보내)|(열어|넣어)\s*(줘|주세요|줄래)/.test(text)) return 'execute';
  return 'ok';
}

const digits = (x: string) => x.replace(/[^\d]/g, '');
// 도구 결과와 손님 말에 들어 있는 수를 모은다
export function collect(x: unknown, into: Set<string>) {
  if (typeof x === 'number') into.add(String(Math.floor(Math.abs(x))));
  else if (typeof x === 'string') for (const m of x.matchAll(/\d[\d,]*/g)) into.add(digits(m[0]));
  else if (Array.isArray(x)) x.forEach((v) => collect(v, into));
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => collect(v, into));
}
const BANNED = /추천(해|드)|유리해요|이득이에요|하시는 게 좋|하는 게 좋아요|더 나아요/;

export function check(blocks: Block[], facts: Set<string>) {
  const texts: string[] = [];
  for (const b of blocks) {
    if (b.t === 'text') texts.push(b.text);
    if (b.t === 'points') b.items.forEach((x) => texts.push(x.name, x.why));
    if (b.t === 'table') b.rows.forEach((r) => texts.push(...r.values));
  }
  const all = texts.join('\n');
  const amounts = [...all.matchAll(/(\d[\d,]*)\s*(만 )?원/g)].map((m) => ({ raw: m[0], n: digits(m[1]), man: !!m[2] }));
  const unknown = amounts.filter((a) => !facts.has(a.n) && !(a.man && facts.has(`${a.n}0000`))).map((a) => a.raw);
  const banned = all.match(BANNED) ? [all.match(BANNED)![0]] : [];
  return { amounts: amounts.length, unknown: [...new Set(unknown)], banned, ok: !unknown.length && !banned.length };
}
