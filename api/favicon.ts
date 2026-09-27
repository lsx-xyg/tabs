/**
 * GET /api/favicon?url=https://example.com
 * 抓取目标网站 HTML，解析 <link rel="icon">，302 重定向到最佳 favicon
 */
export default async function handler(req: any, res: any) {
  const target = req.query?.url
  if (!target || typeof target !== 'string') {
    return res.status(400).send('url required')
  }

  let origin: string
  try {
    const base = new URL(target)
    origin = `${base.protocol}//${base.host}`
  } catch {
    return res.status(400).send('invalid url')
  }

  let bestIcon = `${origin}/favicon.ico`

  try {
    const html = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TabBookmarkBot/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
    }).then((r: any) => r.text()).catch(() => '')

    if (html) {
      const iconRegex = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi
      const tags = html.match(iconRegex) ?? []
      let bestSize = 0

      for (const tag of tags) {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
        const sizesMatch = tag.match(/sizes=["']([^"']+)["']/i)
        if (!hrefMatch) continue

        let href = hrefMatch[1]
        if (href.startsWith('//')) href = new URL(target).protocol + href
        else if (href.startsWith('/')) href = origin + href
        else if (!href.startsWith('http')) href = origin + '/' + href

        let size = 0
        if (sizesMatch) {
          const dim = sizesMatch[1].split('x')
          if (dim.length === 2) size = parseInt(dim[0]) || 0
        }
        if (size >= bestSize || bestIcon === `${origin}/favicon.ico`) {
          bestIcon = href
          bestSize = size
        }
      }
    }
  } catch {
    // fall through to default /favicon.ico
  }

  res.setHeader('Cache-Control', 'public, max-age=86400')
  return res.redirect(302, bestIcon)
}
