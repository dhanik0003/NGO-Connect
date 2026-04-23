const LOCATION_HINTS: Array<{
  keywords: string[];
  latitude: number;
  longitude: number;
}> = [
  { keywords: ["connaught place", "cp", "central delhi"], latitude: 28.6315, longitude: 77.2167 },
  { keywords: ["new delhi", "delhi"], latitude: 28.6139, longitude: 77.209 },
  { keywords: ["gurugram", "gurgaon", "dlf"], latitude: 28.4744, longitude: 77.0727 },
  { keywords: ["noida", "sector 62"], latitude: 28.6212, longitude: 77.3678 },
  { keywords: ["ghaziabad", "indirapuram"], latitude: 28.6408, longitude: 77.3659 },
  { keywords: ["faridabad"], latitude: 28.4105, longitude: 77.3148 },
  { keywords: ["dwarka"], latitude: 28.5966, longitude: 77.0389 },
  { keywords: ["mayur vihar", "east delhi"], latitude: 28.6061, longitude: 77.2965 },
  { keywords: ["lajpat nagar", "south delhi"], latitude: 28.5629, longitude: 77.2436 },
  { keywords: ["karol bagh"], latitude: 28.6512, longitude: 77.1906 },
  { keywords: ["saket"], latitude: 28.5245, longitude: 77.2066 },
  { keywords: ["hauz khas"], latitude: 28.5494, longitude: 77.2001 },
];

const DEFAULT_COORDINATES = {
  latitude: 28.6139,
  longitude: 77.209,
};

const normalizedHash = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

export function inferCoordinatesFromAddress(address: string) {
  const normalizedAddress = address.trim().toLowerCase();

  if (!normalizedAddress) {
    return DEFAULT_COORDINATES;
  }

  const matchedHint = LOCATION_HINTS.find((hint) =>
    hint.keywords.some((keyword) => normalizedAddress.includes(keyword)),
  );

  if (matchedHint) {
    return {
      latitude: matchedHint.latitude,
      longitude: matchedHint.longitude,
    };
  }

  const hash = normalizedHash(normalizedAddress);
  const latOffset = ((hash % 2000) / 1000 - 1) * 0.18;
  const lngOffset = (((Math.floor(hash / 2000)) % 2000) / 1000 - 1) * 0.22;

  return {
    latitude: Number((DEFAULT_COORDINATES.latitude + latOffset).toFixed(6)),
    longitude: Number((DEFAULT_COORDINATES.longitude + lngOffset).toFixed(6)),
  };
}
