export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    route: 'auth-static-canary',
    url: req.url,
    method: req.method,
    ts: Date.now(),
  })
}
