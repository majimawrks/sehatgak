const ALLOWED_HOSTNAMES = ['sehatgak.majima.dev', 'localhost', '127.0.0.1']

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) {
    const referer = request.headers.get('referer') ?? ''
    return (
      referer.startsWith('https://sehatgak.majima.dev/') ||
      referer.startsWith('http://localhost') ||
      referer.startsWith('http://127.0.0.1')
    )
  }
  try {
    const { hostname, protocol } = new URL(origin)
    if (hostname === 'sehatgak.majima.dev' && protocol === 'https:') return true
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    return false
  } catch {
    return false
  }
}

