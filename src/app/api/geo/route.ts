import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Country, State, City } from 'country-state-city';

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
let countryNameToCodeMap: Map<string, string> | null = null;

function initGeoLookups() {
  if (cachedCountries && countryNameToCodeMap) {
    return;
  }

  try {
    const all = Country.getAllCountries();
    cachedCountries = all.map((c) => ({
      code: c.isoCode,
      name: c.name,
      phone: c.phonecode ? (c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`) : '',
    }));

    countryNameToCodeMap = new Map();
    for (const c of all) {
      countryNameToCodeMap.set(c.name.toLowerCase().trim(), c.isoCode.toUpperCase().trim());
      countryNameToCodeMap.set(c.isoCode.toLowerCase().trim(), c.isoCode.toUpperCase().trim());
    }
  } catch (err) {
    console.error('Error initializing country-state-city geo lookups:', err);
    cachedCountries = [];
    countryNameToCodeMap = new Map();
  }
}

function resolveCountryCode(countryParam: string): string {
  if (!countryParam) return '';
  const trimmed = countryParam.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  initGeoLookups();
  return countryNameToCodeMap?.get(trimmed.toLowerCase()) || trimmed.toUpperCase();
}

function resolveStateCode(countryCode: string, stateParam: string): string {
  if (!stateParam) return '';
  const trimmed = stateParam.trim();
  if (!countryCode) return trimmed;

  const states = State.getStatesOfCountry(countryCode);
  const found = states.find(
    (s) =>
      s.isoCode.toLowerCase() === trimmed.toLowerCase() ||
      s.name.toLowerCase() === trimmed.toLowerCase()
  );
  return found ? found.isoCode : trimmed;
}

export async function GET(req: NextRequest) {
  initGeoLookups();

  const { searchParams } = new URL(req.url);
  const action = (searchParams.get('action') || searchParams.get('type') || 'countries').toLowerCase();
  const countryParam =
    searchParams.get('country') ||
    searchParams.get('countryName') ||
    searchParams.get('countryCode') ||
    '';
  const stateParam =
    searchParams.get('state') ||
    searchParams.get('stateName') ||
    searchParams.get('stateCode') ||
    '';

  if (action === 'countries') {
    return NextResponse.json({
      status: true,
      message: 'Countries fetched successfully',
      data: cachedCountries || [],
    });
  }

  if (action === 'states') {
    const cCode = resolveCountryCode(countryParam);
    const states = cCode
      ? State.getStatesOfCountry(cCode).map((s) => ({
          name: s.name,
          stateCode: s.isoCode,
          countryCode: cCode,
        }))
      : [];

    return NextResponse.json({
      status: true,
      countryCode: cCode,
      message: 'States fetched successfully',
      data: states,
    });
  }

  if (action === 'cities') {
    const cCode = resolveCountryCode(countryParam);
    const sCode = resolveStateCode(cCode, stateParam);

    let cityList: string[] = [];
    if (cCode && sCode) {
      // Exact match for country AND state
      cityList = City.getCitiesOfState(cCode, sCode).map((c) => c.name);
    }

    // Fallback to all cities of country if state yielded none
    if (cityList.length === 0 && cCode) {
      cityList = City.getCitiesOfCountry(cCode).map((c) => c.name);
    }

    return NextResponse.json({
      status: true,
      countryCode: cCode,
      stateCode: sCode,
      message: 'Cities fetched successfully',
      data: cityList,
    });
  }

  return NextResponse.json(
    {
      status: false,
      message: 'Invalid action parameter',
      validActions: ['countries', 'states', 'cities'],
    },
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
  initGeoLookups();

  try {
    const body = await req.json().catch(() => ({}));
    const action = (
      body.action ||
      body.type ||
      (body.state ? 'cities' : body.country ? 'states' : 'countries')
    ).toLowerCase();
    const countryParam = body.country || body.countryName || body.countryCode || '';
    const stateParam = body.state || body.stateName || body.stateCode || '';

    if (action === 'countries') {
      return NextResponse.json({
        status: true,
        message: 'Countries fetched successfully',
        data: cachedCountries || [],
      });
    }

    if (action === 'states') {
      const cCode = resolveCountryCode(countryParam);
      const states = cCode
        ? State.getStatesOfCountry(cCode).map((s) => ({
            name: s.name,
            stateCode: s.isoCode,
            countryCode: cCode,
          }))
        : [];

      return NextResponse.json({
        status: true,
        countryCode: cCode,
        message: 'States fetched successfully',
        data: states,
      });
    }

    if (action === 'cities') {
      const cCode = resolveCountryCode(countryParam);
      const sCode = resolveStateCode(cCode, stateParam);

      let cityList: string[] = [];
      if (cCode && sCode) {
        cityList = City.getCitiesOfState(cCode, sCode).map((c) => c.name);
      }
      if (cityList.length === 0 && cCode) {
        cityList = City.getCitiesOfCountry(cCode).map((c) => c.name);
      }

      return NextResponse.json({
        status: true,
        countryCode: cCode,
        stateCode: sCode,
        message: 'Cities fetched successfully',
        data: cityList,
      });
    }

    return NextResponse.json(
      {
        status: false,
        message: 'Invalid action parameter',
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: false,
        message: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
