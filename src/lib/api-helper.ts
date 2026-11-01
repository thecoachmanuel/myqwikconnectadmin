import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

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

