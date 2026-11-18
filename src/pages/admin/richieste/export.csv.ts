import type { APIRoute } from 'astro';
import { all } from '../../../lib/db';

export const prerender = false;

const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const GET: APIRoute = async () => {
  const rows = await all('SELECT id, created_at, status, name, phone, email, comune, service, timing, message, notes, utm_source, utm_medium, utm_campaign, gclid, newsletter_optin FROM leads ORDER BY created_at DESC');
  const cols = ['id', 'created_at', 'status', 'name', 'phone', 'email', 'comune', 'service', 'timing', 'message', 'notes', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'newsletter_optin'];
  const csv = '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => esc(r[c])).join(';'))].join('\r\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="richieste-bota-${new Date().toISOString().slice(0, 10)}.csv"` } });
};
