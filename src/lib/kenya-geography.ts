import { KenyaAdministrativeDivisions } from "kenya-administrative-divisions";

type KenyaCounty = { county_name: string; constituencies: Array<{ constituency_name: string; wards: string[] }> };

const kenyaHierarchy = KenyaAdministrativeDivisions.getAll() as unknown as KenyaCounty[];

export const kenyaCounties = kenyaHierarchy.map((county) => county.county_name).sort((left, right) => left.localeCompare(right));

export function constituenciesForCounty(countyName: string) {
  return (kenyaHierarchy.find((county) => county.county_name === countyName)?.constituencies ?? [])
    .map((constituency) => constituency.constituency_name)
    .sort((left, right) => left.localeCompare(right));
}

export function wardsForConstituency(constituencyName: string) {
  for (const county of kenyaHierarchy) {
    const constituency = county.constituencies.find((item) => item.constituency_name === constituencyName);
    if (constituency) return [...constituency.wards].sort((left, right) => left.localeCompare(right));
  }
  return [];
}

export const kenyaGeographyCoverage = {
  counties: kenyaHierarchy.length,
  constituencies: kenyaHierarchy.reduce((total, county) => total + county.constituencies.length, 0),
  wards: kenyaHierarchy.reduce((total, county) => total + county.constituencies.reduce((count, constituency) => count + constituency.wards.length, 0), 0),
};
