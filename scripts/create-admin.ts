/**
 * Crea (o aggiorna la password di) un utente del gestionale.
 * Uso: npm run admin:create -- email@esempio.it "PasswordSicura123" "Nome"
 * In produzione esegui con le variabili DATABASE_URL e DATABASE_AUTH_TOKEN di Turso.
 */
import { get, run } from '../src/lib/db';
import { hashPassword } from '../src/lib/security';

const [email, password, name = ''] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Uso: npm run admin:create -- <email> <password (min 10 caratteri)> [nome]');
  process.exit(1);
}
const hash = await hashPassword(password);
const existing = await get('SELECT id FROM admin_users WHERE email = ?', [email.toLowerCase()]);
if (existing) {
  await run('UPDATE admin_users SET password_hash = ?, name = COALESCE(NULLIF(?, \'\'), name) WHERE id = ?', [hash, name, existing.id as number]);
  console.log(`Password aggiornata per ${email}`);
} else {
  await run('INSERT INTO admin_users(email, name, password_hash) VALUES (?, ?, ?)', [email.toLowerCase(), name || null, hash]);
  console.log(`Utente creato: ${email}`);
}
