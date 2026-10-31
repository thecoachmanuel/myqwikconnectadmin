import { NextRequest } from 'next/server';
import { getDb, commitDb } from '@/lib/db';
import { jsonResponse } from '@/lib/api-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ value: string }> }
) {
  const { value } = await params;
  const db = getDb();
  const appdata = db.appdata[0];
  if (appdata) {
    appdata.is_social_media = parseInt(value) || 0;
    appdata.updated_at = new Date().toISOString();
    commitDb(db);
  }
  return jsonResponse({ status: true, message: 'Updated successfully' });
}

