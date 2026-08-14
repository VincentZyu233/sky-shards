const basePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBasePath(path: string) {
  const absolutePath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${absolutePath}`;
}

export function stripBasePath(pathname: string) {
  if (!basePath) return pathname;
  if (pathname === basePath || pathname === `${basePath}/`) return '/';
  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
}
