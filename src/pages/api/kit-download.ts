/**
 * Signed download link for the Site Kit. The token (see licence-fulfilment.ts) names the buyer and
 * expires after 30 days. The kit itself is a release asset in the private repository; GitHub answers
 * an authenticated asset request with a short-lived storage URL, and the buyer is redirected there.
 *
 * Env: KIT_DOWNLOAD_SECRET, KIT_GITHUB_TOKEN (read access to the kit repository), KIT_GITHUB_REPO.
 */
import type { APIRoute } from 'astro';
import { verifyDownloadToken } from '../../lib/licence-fulfilment';

export const prerender = false;

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

export const GET: APIRoute = async ({ url }) => {
  const secret = env('KIT_DOWNLOAD_SECRET');
  const token = env('KIT_GITHUB_TOKEN');
  if (!secret || !token) return text('Download is not configured. Write to info@oper-stack.com and we will send the archive by hand.', 503);

  const check = verifyDownloadToken(url.searchParams.get('t') || '', secret);
  if (!check.ok) return text(`This download link is not valid (${check.reason}). Write to info@oper-stack.com for a fresh one.`, 403);

  // Репозиторий выбирается по продукту из подписанной ссылки, а не по одному значению на всех.
  const REPO_BY_PRODUCT: Record<string, string> = {
    'site-kit': env('KIT_GITHUB_REPO', 'oper-stack/site-kit'),
    'pain-to-seo': env('PAIN_GITHUB_REPO', 'oper-stack/pain-to-seo'),
  };
  const repo = REPO_BY_PRODUCT[check.product || 'site-kit'] || REPO_BY_PRODUCT['site-kit'];

  const headers = { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'oper-stack.com kit download' };
  const release = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
  if (!release.ok) return text('The archive is temporarily unavailable. Write to info@oper-stack.com.', 502);
  const body = (await release.json()) as { assets?: { name: string; url: string }[] };
  const asset = (body.assets || []).find((a) => a.name.endsWith('.zip'));
  if (!asset) return text('The archive is temporarily unavailable. Write to info@oper-stack.com.', 502);

  const file = await fetch(asset.url, { headers: { ...headers, Accept: 'application/octet-stream' }, redirect: 'manual' });
  const location = file.headers.get('location');
  if (location) return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } });
  if (file.ok && file.body) {
    return new Response(file.body, {
      status: 200,
      headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${asset.name}"`, 'Cache-Control': 'no-store' },
    });
  }
  return text('The archive is temporarily unavailable. Write to info@oper-stack.com.', 502);
};
