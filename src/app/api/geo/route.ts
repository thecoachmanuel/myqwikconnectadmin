import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CountryItem {
  code: string;
  name: string;
  phone: string;
}

interface StateItem {
  name: string;
  stateCode: string;
  countryCode: string;
}

// In-memory cache for fast lookups
let cachedCountries: CountryItem[] | null = null;
let cachedStatesByCountry: Record<string, StateItem[]> | null = null;
let cachedCitiesByState: Record<string, string[]> | null = null;
let countryNameToCodeMap: Map<string, string> | null = null;
let stateNameToCodeMap: Map<string, string> | null = null;

function loadGeoData() {
  if (cachedCountries && cachedStatesByCountry && cachedCitiesByState) {
    return;
  }

  try {
    const candidates = [
      path.join(process.cwd(), 'src/data/geo'),
      path.join(process.cwd(), 'public/data/geo'),
      path.join(__dirname, '../../../../src/data/geo'),
    ];

    let baseDir = '';
    for (const dir of candidates) {
      if (fs.existsSync(path.join(dir, 'countries.json'))) {
        baseDir = dir;
        break;
      }
    }

    if (!baseDir) {
      console.warn('Geo data directory not found in candidates, fallback to empty');
      cachedCountries = [];
      cachedStatesByCountry = {};
      cachedCitiesByState = {};
      return;
    }

    const cRaw = fs.readFileSync(path.join(baseDir, 'countries.json'), 'utf-8');
    const sRaw = fs.readFileSync(path.join(baseDir, 'states.json'), 'utf-8');
    const ciRaw = fs.readFileSync(path.join(baseDir, 'cities.json'), 'utf-8');

    cachedCountries = JSON.parse(cRaw);
    cachedStatesByCountry = JSON.parse(sRaw);
    cachedCitiesByState = JSON.parse(ciRaw);

    countryNameToCodeMap = new Map();
    if (cachedCountries) {
      for (const c of cachedCountries) {
        countryNameToCodeMap.set(c.name.toLowerCase().trim(), c.code.toUpperCase().trim());
      }
    }

    stateNameToCodeMap = new Map();
    if (cachedStatesByCountry) {
      for (const cCode in cachedStatesByCountry) {
        for (const s of cachedStatesByCountry[cCode]) {
          stateNameToCodeMap.set(`${cCode}:${s.name.toLowerCase().trim()}`, s.stateCode);
          if (!stateNameToCodeMap.has(s.name.toLowerCase().trim())) {
            stateNameToCodeMap.set(s.name.toLowerCase().trim(), s.stateCode);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading geo data:', err);
    cachedCountries = cachedCountries || [];
    cachedStatesByCountry = cachedStatesByCountry || {};
    cachedCitiesByState = cachedCitiesByState || {};
  }
}

export async function GET(req: NextRequest) {
  loadGeoData();

  const { searchParams } = new URL(req.url);
  const action = (searchParams.get('action') || searchParams.get('type') || 'countries').toLowerCase();
  const countryParam = searchParams.get('country') || searchParams.get('countryName') || searchParams.get('countryCode') || '';
  const stateParam = searchParams.get('state') || searchParams.get('stateName') || searchParams.get('stateCode') || '';

  if (action === 'countries') {
    return NextResponse.json({
      status: true,
      message: 'Countries fetched successfully',
      data: cachedCountries || [],
    });
  }

  if (action === 'states') {
    let code = countryParam.trim().toUpperCase();
    if (countryNameToCodeMap && countryNameToCodeMap.has(countryParam.trim().toLowerCase())) {
      code = countryNameToCodeMap.get(countryParam.trim().toLowerCase())!;
    }

    const states = cachedStatesByCountry?.[code] || [];
    return NextResponse.json({
      status: true,
      countryCode: code,
      message: 'States fetched successfully',
      data: states,
    });
  }

  if (action === 'cities') {
    let cCode = countryParam.trim().toUpperCase();
    if (countryNameToCodeMap && countryNameToCodeMap.has(countryParam.trim().toLowerCase())) {
      cCode = countryNameToCodeMap.get(countryParam.trim().toLowerCase())!;
    }

    let sCode = stateParam.trim();
    if (stateNameToCodeMap) {
      const combinedKey = `${cCode}:${stateParam.trim().toLowerCase()}`;
      if (stateNameToCodeMap.has(combinedKey)) {
        sCode = stateNameToCodeMap.get(combinedKey)!;
      } else if (stateNameToCodeMap.has(stateParam.trim().toLowerCase())) {
        sCode = stateNameToCodeMap.get(stateParam.trim().toLowerCase())!;
      }
    }

    const cities = cachedCitiesByState?.[sCode] || [];
    return NextResponse.json({
      status: true,
      stateCode: sCode,
      message: 'Cities fetched successfully',
      data: cities,
    });
  }

  return NextResponse.json({
    status: false,
    message: 'Invalid action parameter',
    validActions: ['countries', 'states', 'cities'],
  }, { status: 400 });
}

export async function POST(req: NextRequest) {
  loadGeoData();

  try {
    const body = await req.json().catch(() => ({}));
    const action = (body.action || body.type || (body.state ? 'cities' : body.country ? 'states' : 'countries')).toLowerCase();
    const countryParam = body.country || body.countryName || body.countryCode || '';
    const stateParam = body.state || body.stateName || body.stateCode || '';

    if (action === 'states') {
      let code = countryParam.trim().toUpperCase();
      if (countryNameToCodeMap && countryNameToCodeMap.has(countryParam.trim().toLowerCase())) {
        code = countryNameToCodeMap.get(countryParam.trim().toLowerCase())!;
      }

      const states = cachedStatesByCountry?.[code] || [];
      return NextResponse.json({
        status: true,
        countryCode: code,
        message: 'States fetched successfully',
        data: states,
      });
    }

    if (action === 'cities') {
      let cCode = countryParam.trim().toUpperCase();
      if (countryNameToCodeMap && countryNameToCodeMap.has(countryParam.trim().toLowerCase())) {
        cCode = countryNameToCodeMap.get(countryParam.trim().toLowerCase())!;
      }

      let sCode = stateParam.trim();
      if (stateNameToCodeMap) {
        const combinedKey = `${cCode}:${stateParam.trim().toLowerCase()}`;
        if (stateNameToCodeMap.has(combinedKey)) {
          sCode = stateNameToCodeMap.get(combinedKey)!;
        } else if (stateNameToCodeMap.has(stateParam.trim().toLowerCase())) {
          sCode = stateNameToCodeMap.get(stateParam.trim().toLowerCase())!;
        }
      }

      const cities = cachedCitiesByState?.[sCode] || [];
      return NextResponse.json({
        status: true,
        stateCode: sCode,
        message: 'Cities fetched successfully',
        data: cities,
      });
    }

    return NextResponse.json({
      status: true,
      message: 'Countries fetched successfully',
      data: cachedCountries || [],
    });
  } catch (err: any) {
    return NextResponse.json({
      status: false,
      message: err.message || 'Error processing request',
    }, { status: 500 });
  }
}

