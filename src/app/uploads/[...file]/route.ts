import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const { file } = await params;
  const filePath = file.join('/');

  if (filePath.startsWith('http:/') || filePath.startsWith('https:/') || filePath.startsWith('http%3A') || filePath.startsWith('https%3A')) {
    const rawUrl = filePath
      .replace(/^https?:\/+/i, 'https://')
      .replace(/^https?%3A%2F%2F+/i, 'https://');
    return NextResponse.redirect(rawUrl, 302);
  }

  const candidates = [
    path.join(process.cwd(), 'public', 'uploads', filePath),
    path.join(process.cwd(), 'public', 'storage', 'uploads', filePath),
    path.join(process.cwd(), 'public', 'storage', 'uploads', path.basename(filePath)),
    path.join(process.cwd(), 'public', 'storage', filePath),
    path.join(process.cwd(), 'public', filePath),
    path.join(process.cwd(), 'public', 'asset', filePath),
  ];

  let resolvedPath: string | null = null;
  for (const cand of candidates) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      resolvedPath = cand;
      break;
    }
  }

  if (!resolvedPath) {
    const fallback = path.join(process.cwd(), 'public', 'asset', 'img', 'user.png');
    if (fs.existsSync(fallback)) {
      resolvedPath = fallback;
    }
  }

  if (!resolvedPath) {
    return new NextResponse('File not found', { status: 404 });
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.svg') contentType = 'image/svg+xml';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.mp4') contentType = 'video/mp4';

  const buffer = fs.readFileSync(resolvedPath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
