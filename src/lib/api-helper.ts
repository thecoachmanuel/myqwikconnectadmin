import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from './db';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apikey, apiKey, authorization, Accept, X-Requested-With',
};

export function handleCors() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function jsonResponse(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders,
  });
}

export function checkApiKey(request: Request): boolean {
  // If no apikey required in local dev, allow. If sent, check if '123'
  const apikey = request.headers.get('apikey') || request.headers.get('apiKey');
  if (!apikey) {
    // Some endpoints may be called without apiKey, but in Laravel CheckHeader it expects 123
    return true; // We default to permissive for local web app & flutter
  }
  return apikey.toString() === '123';
}

export async function uploadToCloudinaryIfConfigured(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    try {
      const db = await getDb();
      const appdata = db.appdata?.[0];
      cloudName = cloudName || appdata?.cloudinary_cloud_name;
      apiKey = apiKey || appdata?.cloudinary_api_key;
      apiSecret = apiSecret || appdata?.cloudinary_api_secret;
    } catch (_) {}
  }

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  try {
    const crypto = await import('crypto');
    const timestamp = Math.floor(Date.now() / 1000);
    const resourceType = mimeType.startsWith('video') ? 'video' : 'image';
    const paramsToSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const formData = new FormData();
    const blob = new Blob([buffer as any], { type: mimeType });
    formData.append('file', blob, fileName);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (result && (result.secure_url || result.url)) {
      return result.secure_url || result.url;
    }
  } catch (err) {
    console.error('Cloudinary upload error:', err);
  }
  return null;
}

export async function deleteFromCloudinary(urlOrPath: string): Promise<boolean> {
  if (!urlOrPath) return false;
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    try {
      const db = await getDb();
      const appdata = db.appdata?.[0];
      cloudName = cloudName || appdata?.cloudinary_cloud_name;
      apiKey = apiKey || appdata?.cloudinary_api_key;
      apiSecret = apiSecret || appdata?.cloudinary_api_secret;
    } catch (_) {}
  }

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  try {
    let publicId = urlOrPath;
    let resourceType = 'image';
    if (urlOrPath.includes('/video/') || urlOrPath.endsWith('.mp4') || urlOrPath.endsWith('.mov')) {
      resourceType = 'video';
    }

    if (urlOrPath.includes('cloudinary.com')) {
      const uploadIdx = urlOrPath.indexOf('/upload/');
      if (uploadIdx !== -1) {
        let afterUpload = urlOrPath.substring(uploadIdx + '/upload/'.length);
        if (afterUpload.match(/^v\d+\//)) {
          afterUpload = afterUpload.replace(/^v\d+\//, '');
        }
        const dotIdx = afterUpload.lastIndexOf('.');
        if (dotIdx !== -1) {
          afterUpload = afterUpload.substring(0, dotIdx);
        }
        publicId = afterUpload;
      }
    }

    if (!publicId) return false;

    const crypto = await import('crypto');
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    return result && result.result === 'ok';
  } catch (err) {
    console.error('Cloudinary destroy error:', err);
    return false;
  }
}

export async function parseRequestBody(request: Request): Promise<{ fields: Record<string, any>; files: { fieldname: string; filename: string; path: string; url: string }[] }> {
  const contentType = request.headers.get('content-type') || '';
  const fields: Record<string, any> = {};
  const files: { fieldname: string; filename: string; path: string; url: string }[] = [];

  if (contentType.includes('application/json')) {
    try {
      const json = await request.json();
      return { fields: json || {}, files: [] };
    } catch {
      return { fields: {}, files: [] };
    }
  }

  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await request.formData();
      let isFsWritable = false;
      const uploadDir = path.join(process.cwd(), 'public', 'storage', 'uploads');
      const directUploadDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        if (!fs.existsSync(directUploadDir)) {
          fs.mkdirSync(directUploadDir, { recursive: true });
        }
        isFsWritable = true;
      } catch {
        isFsWritable = false;
      }

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          if (value.size > 0 && value.name) {
            const ext = path.extname(value.name) || '.jpg';
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
            const arrayBuffer = await value.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            let targetPath = '';
            let relPath = `uploads/${uniqueName}`;
            const mimeType = value.type || (ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : ext === '.mp4' ? 'video/mp4' : 'image/jpeg');

            // Try Cloudinary first if credentials configured
            const cloudUrl = await uploadToCloudinaryIfConfigured(buffer, uniqueName, mimeType);
            if (cloudUrl) {
              relPath = cloudUrl;
            } else if (isFsWritable) {
              try {
                targetPath = path.join(uploadDir, uniqueName);
                fs.writeFileSync(targetPath, buffer);
                try {
                  fs.writeFileSync(path.join(directUploadDir, uniqueName), buffer);
                } catch {}
              } catch {
                isFsWritable = false;
              }
            }

            if (!isFsWritable) {
              try {
                targetPath = path.join('/tmp', uniqueName);
                fs.writeFileSync(targetPath, buffer);
              } catch {}
            }

            if (!isFsWritable && (process.env.VERCEL || buffer.length <= 4 * 1024 * 1024)) {
              relPath = `data:${mimeType};base64,${buffer.toString('base64')}`;
            }

            files.push({
              fieldname: key,
              filename: uniqueName,
              path: targetPath,
              url: relPath,
            });

            // Also attach as field if single file
            if (!fields[key]) {
              fields[key] = relPath;
            } else if (Array.isArray(fields[key])) {
              fields[key].push(relPath);
            } else {
              fields[key] = [fields[key], relPath];
            }
          }
        } else {
          // Regular text field
          if (fields[key] !== undefined) {
            if (Array.isArray(fields[key])) {
              fields[key].push(value);
            } else {
              fields[key] = [fields[key], value];
            }
          } else {
            fields[key] = value;
          }
        }
      }
      return { fields, files };
    } catch (err) {
      console.error('Error parsing multipart form:', err);
      return { fields, files };
    }
  }

  // Fallback try text or url search params
  try {
    const text = await request.text();
    if (!text) return { fields: {}, files: [] };
    try {
      const json = JSON.parse(text);
      return { fields: json, files: [] };
    } catch {
      const params = new URLSearchParams(text);
      for (const [k, v] of params.entries()) {
        fields[k] = v;
      }
      return { fields, files: [] };
    }
  } catch {
    return { fields: {}, files: [] };
  }
}

