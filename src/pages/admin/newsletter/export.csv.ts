import type { APIRoute } from 'astro';
import { all } from '../../../lib/db';

export const prerender = false;
const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const GET: APIRoute = async () => {
  const cols = ['email', 'name', 'status', 'source', 'created_at', 'confirmed_at', 'unsubscribed_at', 'consent_version', 'consent_text', 'consent_ip'];
  const rows = await all(`SELECT ${cols.join(', ')} FROM subscribers ORDER BY created_at DESC`);
  const csv = '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => esc(r[c])).join(';'))].join('\r\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="newsletter-bota-${new Date().toISOString().slice(0, 10)}.csv"` } });
};
