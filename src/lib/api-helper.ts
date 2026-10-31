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
      const uploadDir = path.join(process.cwd(), 'public', 'storage', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          if (value.size > 0 && value.name) {
            const ext = path.extname(value.name) || '.jpg';
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
            const targetPath = path.join(uploadDir, uniqueName);
            const arrayBuffer = await value.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(targetPath, buffer);

            const relPath = `uploads/${uniqueName}`;
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

