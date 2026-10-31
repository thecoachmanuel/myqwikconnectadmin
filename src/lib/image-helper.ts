export function getImageUrl(path?: string | null): string {
  if (!path) return '/asset/img/user.png';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const clean = path.replace(/^\/+/, '');
  if (clean.startsWith('public/storage/')) return `/${clean}`;
  if (clean.startsWith('storage/')) return `/${clean}`;
  if (clean.startsWith('asset/')) return `/${clean}`;
  if (clean.startsWith('uploads/')) return `/storage/${clean}`;
  return `/storage/uploads/${clean}`;
}

