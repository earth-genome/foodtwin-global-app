import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

type CountryLimitFeature = Feature<Polygon, CountryLimitProperties>;

export interface CountryLimitsGeoJSON extends FeatureCollection {
  features: CountryLimitFeature[];
}
interface CountryLimitProperties {
  id: string;
  scalerank: number;
  labelrank: number;
  sovereignt: string;
  sov_a3: string;
  adm0_dif: number;
  level: number;
  type: string;
  admin: string;
  adm0_a3: string;
  geou_dif: number;
  geounit: string;
  gu_a3: string;
  su_dif: number;
  subunit: string;
  su_a3: string;
  brk_diff: number;
  name: string;
  name_long: string;
  brk_a3: string;
  brk_name: string;
  brk_group: null | string;
  abbrev: string;
  postal: string;
  formal_en: string | null;
  formal_fr: string | null;
  note_adm0: string | null;
  note_brk: string | null;
  name_sort: string;
  name_alt: string | null;
  mapcolor7: number;
  mapcolor8: number;
  mapcolor9: number;
  mapcolor13: number;
  pop_est: number;
  gdp_md_est: number;
  pop_year: number;
  lastcensus: number;
  gdp_year: number;
  economy: string;
  income_grp: string;
  wikipedia: number;
  fips_10: string | null;
  iso_a2: string;
  iso_a3: string;
  iso_n3: string;
  un_a3: string;
  wb_a2: string;
  wb_a3: string;
  woe_id: number;
  adm0_a3_is: string;
  adm0_a3_us: string;
  adm0_a3_un: number;
  adm0_a3_wb: number;
  continent: string;
  region_un: string;
  subregion: string;
  region_wb: string;
  name_len: number;
  long_len: number;
  abbrev_len: number;
  tiny: number;
  homepart: number;
  featureclass: string;
}

export type CountryCapitalFeature = Feature<Point, CountryCapitalProperties>;

export interface CountryCapitalsGeoJSON extends FeatureCollection {
  features: CountryCapitalFeature[];
}

interface CountryCapitalProperties {
  id: string;
  SCALERANK: number;
  NATSCALE: number;
  LABELRANK: number;
  FEATURECLA: string;
  NAME: string;
  NAMEPAR: string | null;
  NAMEALT: string | null;
  NAMEASCII: string;
  ADM0CAP: number;
  CAPIN: string | null;
  WORLDCITY: number;
  MEGACITY: number;
  SOV0NAME: string;
  SOV_A3: string;
  ADM0NAME: string;
  ADM0_A3: string;
  ADM1NAME: string;
  ISO_A2: string;
  NOTE: string | null;
  LATITUDE: number;
  LONGITUDE: number;
  POP_MAX: number;
  POP_MIN: number;
  POP_OTHER: number;
  RANK_MAX: number;
  RANK_MIN: number;
  MEGANAME: string | null;
  LS_NAME: string;
  MAX_POP10: number;
  MAX_POP20: number;
  MAX_POP50: number;
  MAX_POP300: number;
  MAX_POP310: number;
  MAX_NATSCA: number;
  MIN_AREAKM: number;
  MAX_AREAKM: number;
  MIN_AREAMI: number;
  MAX_AREAMI: number;
  MIN_PERKM: number;
  MAX_PERKM: number;
  MIN_PERMI: number;
  MAX_PERMI: number;
  MIN_BBXMIN: number;
  MAX_BBXMIN: number;
  MIN_BBXMAX: number;
  MAX_BBXMAX: number;
  MIN_BBYMIN: number;
  MAX_BBYMIN: number;
  MIN_BBYMAX: number;
  MAX_BBYMAX: number;
  MEAN_BBXC: number;
  MEAN_BBYC: number;
  TIMEZONE: string;
  UN_FID: number;
  POP1950: number;
  POP1955: number;
  POP1960: number;
  POP1965: number;
  POP1970: number;
  POP1975: number;
  POP1980: number;
  POP1985: number;
  POP1990: number;
  POP1995: number;
  POP2000: number;
  POP2005: number;
  POP2010: number;
  POP2015: number;
  POP2020: number;
  POP2025: number;
  POP2050: number;
  MIN_ZOOM: number;
  WIKIDATAID: string;
  WOF_ID: number;
  CAPALT: number;
  NAME_EN: string;
  NAME_DE: string;
  NAME_ES: string;
  NAME_FR: string;
  NAME_PT: string;
  NAME_RU: string;
  NAME_ZH: string;
  LABEL: string | null;
  NAME_AR: string;
  NAME_BN: string;
  NAME_EL: string;
  NAME_HI: string;
  NAME_HU: string;
  NAME_ID: string;
  NAME_IT: string;
  NAME_JA: string;
  NAME_KO: string;
  NAME_NL: string;
  NAME_PL: string;
  NAME_SV: string;
  NAME_TR: string;
  NAME_VI: string;
  NE_ID: number;
  NAME_FA: string;
  NAME_HE: string;
  NAME_UK: string;
  NAME_UR: string;
  NAME_ZHT: string;
  GEONAMESID: number;
  FCLASS_ISO: string | null;
  FCLASS_US: string | null;
  FCLASS_FR: string | null;
  FCLASS_RU: string | null;
  FCLASS_ES: string | null;
  FCLASS_CN: string | null;
  FCLASS_TW: string | null;
  FCLASS_IN: string | null;
  FCLASS_NP: string | null;
  FCLASS_PK: string | null;
  FCLASS_DE: string | null;
  FCLASS_GB: string | null;
  FCLASS_BR: string | null;
  FCLASS_IL: string | null;
  FCLASS_PS: string | null;
  FCLASS_SA: string | null;
  FCLASS_EG: string | null;
  FCLASS_MA: string | null;
  FCLASS_PT: string | null;
  FCLASS_AR: string | null;
  FCLASS_JP: string | null;
  FCLASS_KO: string | null;
  FCLASS_VN: string | null;
  FCLASS_TR: string | null;
  FCLASS_ID: string | null;
  FCLASS_PL: string | null;
  FCLASS_GR: string | null;
  FCLASS_IT: string | null;
  FCLASS_NL: string | null;
  FCLASS_SE: string | null;
  FCLASS_BD: string | null;
  FCLASS_UA: string | null;
  FCLASS_TLC: string | null;
}
