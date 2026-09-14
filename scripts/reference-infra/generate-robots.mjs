#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SEARCH_AND_USER_FETCH_CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-User',
  'Claude-SearchBot',
  'DuckAssistBot',
  'MistralAI-User',
]

export const TRAINING_CRAWLERS = [
  'GPTBot',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'Applebot-Extended',
  'FacebookBot',
  'meta-externalagent',
  'Bytespider',
]

function crawlerBlock(userAgent, allowed, privatePaths) {
  return [
    `User-agent: ${userAgent}`,
    allowed ? 'Allow: /' : 'Disallow: /',
    ...(allowed
      ? privatePaths.map((pathname) => `Disallow: ${pathname}`)
      : []),
  ].join('\n')
}

export function generateRobots(config) {
  const robots = config.robots ?? {}
  const allowSearch = robots.allowSearchCrawlers !== false
  const allowTraining = robots.allowTrainingCrawlers === true
  const disallow = Array.isArray(robots.disallow) ? robots.disallow : []
  if (
    disallow.some(
      (pathname) =>
        typeof pathname !== 'string' ||
        !pathname.startsWith('/') ||
        /[\r\n]/.test(pathname),
    )
  ) {
    throw new Error('Every robots.disallow entry must be a single-line absolute path')
  }
  if (
    robots.contentSignal !== undefined &&
    (typeof robots.contentSignal !== 'string' || /[\r\n]/.test(robots.contentSignal))
  ) {
    throw new Error('robots.contentSignal must be a single line')
  }
  /*
   * Content-Signal объявляется внутри блока `*`, как его и читают: это надпись на входе
   * («читать и цитировать можно, обучать модель нельзя»), а не комментарий в конце файла.
   * Раньше генератор дописывал её строкой-комментарием, поэтому живые файлы обоих сайтов
   * правили руками, и первый же запуск `npm run aeo:robots` молча стирал настоящую директиву.
   * Доступ роботов задаётся блоками ниже и этой строкой не отменяется.
   */
  const signalLines = robots.contentSignal
    ? ['# Content Signals (contentsignals.org / IETF draft-romm-aipref-contentsignals)',
       ...(robots.contentSignalNote ? [`# ${robots.contentSignalNote}`] : []),
       `Content-Signal: ${robots.contentSignal}`, 'Allow: /']
    : []
  const blocks = [
    [
      'User-agent: *',
      ...signalLines,
      ...disallow.map((pathname) => `Disallow: ${pathname}`),
    ].join('\n'),
    '# Search indexing and user-requested fetchers',
    ...SEARCH_AND_USER_FETCH_CRAWLERS.map((agent) =>
      crawlerBlock(agent, allowSearch, disallow),
    ),
    '# Model-training crawlers',
    ...TRAINING_CRAWLERS.map((agent) =>
      crawlerBlock(agent, allowTraining, disallow),
    ),
  ]

  // Content-Signal may be emitted as an additional declaration, but crawler
  // access above remains authoritative and is never replaced by this header.
  /*
   * Подсказка агентам про markdown-версии страниц. Тоже дописывалась руками и тоже терялась
   * при каждом запуске генератора: всё, что должно быть в файле, лежит в настройке.
   */
  if (Array.isArray(robots.footerNote) && robots.footerNote.length) {
    blocks.push(robots.footerNote.map((line) => `# ${line}`).join('\n'))
  }
  blocks.push(`Sitemap: ${new URL('/sitemap-index.xml', config.siteUrl).href}`)
  return `${blocks.join('\n\n')}\n`
}

function valueAfter(args, name, fallback) {
  const index = args.indexOf(name)
  return index < 0 ? fallback : args[index + 1]
}

async function main() {
  const args = process.argv.slice(2)
  const configPath = path.resolve(
    valueAfter(args, '--config', 'reference-infra.config.json'),
  )
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const output = generateRobots(config)
  const outputPath = valueAfter(args, '--output', null)
  if (outputPath) await writeFile(path.resolve(outputPath), output, 'utf8')
  else process.stdout.write(output)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
