'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface CountryItem {
  code: string;
  name: string;
  phone: string;
}

export interface StateItem {
  name: string;
  stateCode: string;
  countryCode: string;
}

interface CountryStateCitySelectProps {
  country: string;
  setCountry: (val: string) => void;
  state: string;
  setState: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  colSize?: string; // e.g. "col-md-3 col-sm-12" or "col-md-4 col-sm-12"
  required?: boolean;
}

// In-memory client caches across re-renders
let cachedClientCountries: CountryItem[] | null = null;
const cachedClientStates = new Map<string, StateItem[]>();
const cachedClientCities = new Map<string, string[]>();

export default function CountryStateCitySelect({
  country,
  setCountry,
  state,
  setState,
  city,
  setCity,
  colSize = 'col-md-3 col-sm-12',
  required = false,
}: CountryStateCitySelectProps) {
  // Lists
  const [countries, setCountries] = useState<CountryItem[]>(cachedClientCountries || []);
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Loading states
  const [loadingCountries, setLoadingCountries] = useState(!cachedClientCountries);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Dropdown open states
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  // Search terms
  const [searchCountry, setSearchCountry] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchCity, setSearchCity] = useState('');

  // Custom text entry toggle for rare/custom locations
  const [customCountryMode, setCustomCountryMode] = useState(false);
  const [customStateMode, setCustomStateMode] = useState(false);
  const [customCityMode, setCustomCityMode] = useState(false);

  // Refs for click outside
  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Load countries on mount
  useEffect(() => {
    let active = true;

    if (cachedClientCountries && cachedClientCountries.length > 0) {
      setCountries(cachedClientCountries);
      setLoadingCountries(false);
      return;
    }

    setLoadingCountries(true);
    // Try fetching from /api/geo?action=countries or fallback to /data/geo/countries.json
    fetch('/api/geo?action=countries')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: CountryItem[] = data.data || [];
        cachedClientCountries = list;
        setCountries(list);
        setLoadingCountries(false);
      })
      .catch((err) => {
        console.warn('API geo fetch countries failed, trying static /data/geo/countries.json', err);
        fetch('/data/geo/countries.json')
          .then((res) => res.json())
          .then((list) => {
            if (!active) return;
            cachedClientCountries = list;
            setCountries(list);
            setLoadingCountries(false);
          })
          .catch((e) => {
            console.error('Failed to load countries', e);
            if (active) setLoadingCountries(false);
          });
      });

    return () => {
      active = false;
    };
  }, []);

  // Find country code from current country name
  const currentCountryCode = useMemo(() => {
    if (!country) return '';
    const found = countries.find(
      (c) => c.name.toLowerCase() === country.toLowerCase() || c.code.toLowerCase() === country.toLowerCase()
    );
    return found ? found.code : '';
  }, [country, countries]);

  // Load states when country changes
  useEffect(() => {
    let active = true;

    if (!country) {
      setStates([]);
      return;
    }

    const code = currentCountryCode || country;
    if (cachedClientStates.has(code)) {
      setStates(cachedClientStates.get(code)!);
      return;
    }

    setLoadingStates(true);
    fetch(`/api/geo?action=states&country=${encodeURIComponent(country)}&countryCode=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: StateItem[] = data.data || [];
        cachedClientStates.set(code, list);
        setStates(list);
        setLoadingStates(false);
      })
      .catch((err) => {
        console.warn('Failed to load states from API, trying states.json', err);
        fetch('/data/geo/states.json')
          .then((res) => res.json())
          .then((allStatesMap) => {
            if (!active) return;
            const list = allStatesMap[code] || [];
            cachedClientStates.set(code, list);
            setStates(list);
            setLoadingStates(false);
          })
          .catch((e) => {
            console.error('Failed to load states', e);
            if (active) setLoadingStates(false);
          });
      });

    return () => {
      active = false;
    };
  }, [country, currentCountryCode]);

  // Find state code from current state name
  const currentStateCode = useMemo(() => {
    if (!state) return '';
    const found = states.find(
      (s) => s.name.toLowerCase() === state.toLowerCase() || s.stateCode.toLowerCase() === state.toLowerCase()
    );
    return found ? found.stateCode : '';
  }, [state, states]);

  // Load cities when state changes
  useEffect(() => {
    let active = true;

    if (!state) {
      setCities([]);
      return;
    }

    const sCode = currentStateCode || state;
    if (cachedClientCities.has(sCode)) {
      setCities(cachedClientCities.get(sCode)!);
      return;
    }

    setLoadingCities(true);
    fetch(`/api/geo?action=cities&state=${encodeURIComponent(state)}&stateCode=${encodeURIComponent(sCode)}&country=${encodeURIComponent(country)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: string[] = data.data || [];
        cachedClientCities.set(sCode, list);
        setCities(list);
        setLoadingCities(false);
      })
      .catch((err) => {
        console.warn('Failed to load cities from API, trying cities.json', err);
        fetch('/data/geo/cities.json')
          .then((res) => res.json())
          .then((allCitiesMap) => {
            if (!active) return;
            const list = allCitiesMap[sCode] || [];
            cachedClientCities.set(sCode, list);
            setCities(list);
            setLoadingCities(false);
          })
          .catch((e) => {
            console.error('Failed to load cities', e);
            if (active) setLoadingCities(false);
          });
      });

    return () => {
      active = false;
    };
  }, [state, currentStateCode, country]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setOpenCountry(false);
      }
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        setOpenState(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setOpenCity(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered lists
  const filteredCountries = useMemo(() => {
    if (!searchCountry.trim()) return countries;
    const q = searchCountry.toLowerCase().trim();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [countries, searchCountry]);

  const filteredStates = useMemo(() => {
    if (!searchState.trim()) return states;
    const q = searchState.toLowerCase().trim();
    return states.filter((s) => s.name.toLowerCase().includes(q) || s.stateCode.toLowerCase().includes(q));
  }, [states, searchState]);

  const filteredCities = useMemo(() => {
    if (!searchCity.trim()) return cities;
    const q = searchCity.toLowerCase().trim();
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, searchCity]);

  // Selection handlers
  const handleSelectCountry = (selected: CountryItem) => {
    setCountry(selected.name);
    setState('');
    setCity('');
    setOpenCountry(false);
    setSearchCountry('');
  };

  const handleSelectState = (selected: StateItem) => {
    setState(selected.name);
    setCity('');
    setOpenState(false);
    setSearchState('');
  };

  const handleSelectCity = (cityName: string) => {
    setCity(cityName);
    setOpenCity(false);
    setSearchCity('');
  };

  return (
    <>
      {/* Country Field */}
      <div className={`form-group ${colSize}`}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="m-0 font-weight-bold" htmlFor="country">
            Country {required && <span className="text-danger">*</span>}
          </label>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-muted"
            style={{ fontSize: '11px', textDecoration: 'none' }}
            onClick={() => setCustomCountryMode(!customCountryMode)}
            title="Toggle between dropdown search and manual typing"
          >
            {customCountryMode ? 'Use List' : 'Type Custom'}
          </button>
        </div>

        {customCountryMode ? (
          <input
            id="country"
            name="country"
            className="form-control"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
            }}
            placeholder="Type country name..."
            required={required}
          />
        ) : (
          <div className="position-relative" ref={countryRef}>
            <div
              className={`form-control d-flex justify-content-between align-items-center ${
                openCountry ? 'border-primary' : ''
              }`}
              style={{
                cursor: 'pointer',
                backgroundColor: '#fff',
                height: '42px',
                padding: '6px 16px',
                borderRadius: '30px',
              }}
              onClick={() => {
                setOpenCountry(!openCountry);
                setOpenState(false);
                setOpenCity(false);
              }}
            >
              <span
                style={{
                  color: country ? '#333' : '#999',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '14px',
                }}
              >
                {loadingCountries ? 'Loading countries...' : country || 'Select Country'}
              </span>
              <div className="d-flex align-items-center">
                {country && (
                  <button
                    type="button"
                    className="btn btn-sm text-muted p-0 mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCountry('');
                      setState('');
                      setCity('');
                    }}
                    style={{ fontSize: '12px' }}
                    title="Clear"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                <i className={`fas fa-chevron-${openCountry ? 'up' : 'down'} text-muted`} style={{ fontSize: '11px' }}></i>
              </div>
            </div>

            {/* Hidden input for standard form submission compatibility */}
            <input type="hidden" name="country" value={country} required={required} />

            {/* Country Dropdown Menu */}
            {openCountry && (
              <div
                className="position-absolute w-100 bg-white border rounded shadow-lg"
                style={{
                  top: '100%',
                  left: 0,
                  zIndex: 1050,
                  marginTop: '4px',
                  maxHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Search Bar matching Flutter App */}
                <div className="p-2 border-bottom bg-light">
                  <div className="input-group input-group-sm">
                    <div className="input-group-prepend">
                      <span className="input-group-text bg-white border-right-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control form-control-sm border-left-0"
                      placeholder="Search country..."
                      value={searchCountry}
                      onChange={(e) => setSearchCountry(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Country List */}
                <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                  {filteredCountries.length === 0 ? (
                    <div className="p-3 text-center text-muted small">
                      No country found.
                      {searchCountry && (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              setCountry(searchCountry.trim());
                              setState('');
                              setCity('');
                              setOpenCountry(false);
                            }}
                          >
                            Use &quot;{searchCountry}&quot;
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredCountries.map((c) => {
                      const isSelected = country.toLowerCase() === c.name.toLowerCase();
                      return (
                        <div
                          key={c.code}
                          className={`d-flex justify-content-between align-items-center px-3 py-2 pointer ${
                            isSelected ? 'bg-primary text-white font-weight-bold' : 'text-dark hover-light'
                          }`}
                          style={{
                            cursor: 'pointer',
                            fontSize: '13px',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                          onClick={() => handleSelectCountry(c)}
                        >
                          <span>{c.name}</span>
                          <span className={isSelected ? 'text-white-50' : 'text-muted'} style={{ fontSize: '11px' }}>
                            {c.phone || c.code}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* State Field */}
      <div className={`form-group ${colSize}`}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="m-0 font-weight-bold" htmlFor="state">
            State {required && <span className="text-danger">*</span>}
          </label>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-muted"
            style={{ fontSize: '11px', textDecoration: 'none' }}
            onClick={() => setCustomStateMode(!customStateMode)}
            title="Toggle between dropdown search and manual typing"
          >
            {customStateMode ? 'Use List' : 'Type Custom'}
          </button>
        </div>

        {customStateMode ? (
          <input
            id="state"
            name="state"
            className="form-control"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
            }}
            placeholder="Type state/province name..."
            required={required}
          />
        ) : (
          <div className="position-relative" ref={stateRef}>
            <div
              className={`form-control d-flex justify-content-between align-items-center ${
                openState ? 'border-primary' : ''
              }`}
              style={{
                cursor: !country ? 'not-allowed' : 'pointer',
                backgroundColor: !country ? '#f8f9fa' : '#fff',
                opacity: !country ? 0.7 : 1,
                height: '42px',
                padding: '6px 16px',
                borderRadius: '30px',
              }}
              onClick={() => {
                if (!country) return;
                setOpenState(!openState);
                setOpenCountry(false);
                setOpenCity(false);
              }}
            >
              <span
                style={{
                  color: state ? '#333' : '#999',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '14px',
                }}
              >
                {loadingStates
                  ? 'Loading states...'
                  : !country
                  ? 'Select Country first'
                  : state || (states.length > 0 ? 'Select State' : 'Enter State')}
              </span>
              <div className="d-flex align-items-center">
                {state && (
                  <button
                    type="button"
                    className="btn btn-sm text-muted p-0 mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setState('');
                      setCity('');
                    }}
                    style={{ fontSize: '12px' }}
                    title="Clear"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                <i className={`fas fa-chevron-${openState ? 'up' : 'down'} text-muted`} style={{ fontSize: '11px' }}></i>
              </div>
            </div>

            {/* Hidden input for form submission */}
            <input type="hidden" name="state" value={state} required={required} />

            {/* State Dropdown Menu */}
            {openState && country && (
              <div
                className="position-absolute w-100 bg-white border rounded shadow-lg"
                style={{
                  top: '100%',
                  left: 0,
                  zIndex: 1050,
                  marginTop: '4px',
                  maxHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Search Bar matching Flutter App */}
                <div className="p-2 border-bottom bg-light">
                  <div className="input-group input-group-sm">
                    <div className="input-group-prepend">
                      <span className="input-group-text bg-white border-right-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control form-control-sm border-left-0"
                      placeholder="Search state..."
                      value={searchState}
                      onChange={(e) => setSearchState(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* State List */}
                <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                  {filteredStates.length === 0 ? (
                    <div className="p-3 text-center text-muted small">
                      {states.length === 0 ? 'No predefined states for this country.' : 'No state found.'}
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            if (searchState.trim()) {
                              setState(searchState.trim());
                            } else {
                              setCustomStateMode(true);
                            }
                            setCity('');
                            setOpenState(false);
                          }}
                        >
                          {searchState.trim() ? `Use "${searchState.trim()}"` : 'Type Custom State'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredStates.map((s, idx) => {
                      const isSelected = state.toLowerCase() === s.name.toLowerCase();
                      return (
                        <div
                          key={`${s.stateCode}-${idx}`}
                          className={`d-flex justify-content-between align-items-center px-3 py-2 pointer ${
                            isSelected ? 'bg-primary text-white font-weight-bold' : 'text-dark hover-light'
                          }`}
                          style={{
                            cursor: 'pointer',
                            fontSize: '13px',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                          onClick={() => handleSelectState(s)}
                        >
                          <span>{s.name}</span>
                          <span className={isSelected ? 'text-white-50' : 'text-muted'} style={{ fontSize: '11px' }}>
                            {s.stateCode}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* City Field */}
      <div className={`form-group ${colSize}`}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="m-0 font-weight-bold" htmlFor="city">
            City {required && <span className="text-danger">*</span>}
          </label>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-muted"
            style={{ fontSize: '11px', textDecoration: 'none' }}
            onClick={() => setCustomCityMode(!customCityMode)}
            title="Toggle between dropdown search and manual typing"
          >
            {customCityMode ? 'Use List' : 'Type Custom'}
          </button>
        </div>

        {customCityMode ? (
          <input
            id="city"
            name="city"
            className="form-control"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
            }}
            placeholder="Type city name..."
            required={required}
          />
        ) : (
          <div className="position-relative" ref={cityRef}>
            <div
              className={`form-control d-flex justify-content-between align-items-center ${
                openCity ? 'border-primary' : ''
              }`}
              style={{
                cursor: !state ? 'not-allowed' : 'pointer',
                backgroundColor: !state ? '#f8f9fa' : '#fff',
                opacity: !state ? 0.7 : 1,
                height: '42px',
                padding: '6px 16px',
                borderRadius: '30px',
              }}
              onClick={() => {
                if (!state) return;
                setOpenCity(!openCity);
                setOpenCountry(false);
                setOpenState(false);
              }}
            >
              <span
                style={{
                  color: city ? '#333' : '#999',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '14px',
                }}
              >
                {loadingCities
                  ? 'Loading cities...'
                  : !state
                  ? 'Select State first'
                  : city || (cities.length > 0 ? 'Select City' : 'Enter City')}
              </span>
              <div className="d-flex align-items-center">
                {city && (
                  <button
                    type="button"
                    className="btn btn-sm text-muted p-0 mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCity('');
                    }}
                    style={{ fontSize: '12px' }}
                    title="Clear"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
                <i className={`fas fa-chevron-${openCity ? 'up' : 'down'} text-muted`} style={{ fontSize: '11px' }}></i>
              </div>
            </div>

            {/* Hidden input for form submission */}
            <input type="hidden" name="city" value={city} required={required} />

            {/* City Dropdown Menu */}
            {openCity && state && (
              <div
                className="position-absolute w-100 bg-white border rounded shadow-lg"
                style={{
                  top: '100%',
                  left: 0,
                  zIndex: 1050,
                  marginTop: '4px',
                  maxHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Search Bar matching Flutter App */}
                <div className="p-2 border-bottom bg-light">
                  <div className="input-group input-group-sm">
                    <div className="input-group-prepend">
                      <span className="input-group-text bg-white border-right-0">
                        <i className="fas fa-search text-muted"></i>
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control form-control-sm border-left-0"
                      placeholder="Search city..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* City List */}
                <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                  {filteredCities.length === 0 ? (
                    <div className="p-3 text-center text-muted small">
                      {cities.length === 0 ? 'No predefined cities for this state.' : 'No city found.'}
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            if (searchCity.trim()) {
                              setCity(searchCity.trim());
                            } else {
                              setCustomCityMode(true);
                            }
                            setOpenCity(false);
                          }}
                        >
                          {searchCity.trim() ? `Use "${searchCity.trim()}"` : 'Type Custom City'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredCities.map((cityName, idx) => {
                      const isSelected = city.toLowerCase() === cityName.toLowerCase();
                      return (
                        <div
                          key={`${cityName}-${idx}`}
                          className={`d-flex justify-content-between align-items-center px-3 py-2 pointer ${
                            isSelected ? 'bg-primary text-white font-weight-bold' : 'text-dark hover-light'
                          }`}
                          style={{
                            cursor: 'pointer',
                            fontSize: '13px',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                          onClick={() => handleSelectCity(cityName)}
                        >
                          <span>{cityName}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .hover-light:hover {
          background-color: #f7f9fa;
        }
        .pointer {
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
