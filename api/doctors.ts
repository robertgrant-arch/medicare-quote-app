import type { VercelRequest, VercelResponse } from "@vercel/node";
// v3: fix name filtering - post-filter results by searched name

// Haversine distance in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get lat/lng for a zip code using zippopotam.us
async function getZipCoords(zip: string): Promise<{ lat: number; lng: number; state: string } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      state: place["state abbreviation"],
    };
  } catch {
    return null;
  }
}

// Search NPPES NPI registry
async function searchNPPES(name: string, state: string, limit = 200): Promise<any[]> {
  const parts = name.trim().split(/\s+/);
  const params = new URLSearchParams({
    version: "2.1",
    limit: String(limit),
    enumeration_type: "NPI-1",
  });

  if (parts.length >= 2) {
    params.set("first_name", parts[0] + "*");
    params.set("last_name", parts[parts.length - 1] + "*");
  } else {
    params.set("last_name", parts[0] + "*");
  }

  if (state) {
    params.set("state", state);
  }

  try {
    const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params}`);
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// Check if a provider's name matches the search query
function nameMatchesSearch(providerName: string, searchName: string): boolean {
  const search = searchName.toLowerCase().trim();
  const provider = providerName.toLowerCase();
  const parts = search.split(/\s+/);
  // Every part of the search must appear somewhere in the provider name
  return parts.every(part => provider.includes(part));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const name = (req.query.name as string || "").trim();
  const zip = (req.query.zip as string || "").trim();
  const radius = parseInt(req.query.radius as string || "25", 10);

  if (!name || name.length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters" });
  }

  // Get coordinates for user's zip
  let userCoords: { lat: number; lng: number; state: string } | null = null;
  if (zip) {
    userCoords = await getZipCoords(zip);
  }

  // Search NPPES - use state filter if we have zip coords
  const results = await searchNPPES(name, userCoords?.state || "");

  // Map results to our format
  const doctors = results.map((r: any) => {
    const basic = r.basic || {};
    const addr = r.addresses?.find((a: any) => a.address_purpose === "LOCATION") || r.addresses?.[0] || {};
    const taxonomy = r.taxonomies?.find((t: any) => t.primary) || r.taxonomies?.[0] || {};

    const fullName = basic.credential
      ? `${basic.last_name}, ${basic.first_name} ${basic.credential}`
      : `${basic.last_name}, ${basic.first_name}`;

    const fullAddress = [
      addr.address_1,
      addr.address_2,
      addr.city,
      addr.state,
      addr.postal_code?.substring(0, 5),
    ].filter(Boolean).join(", ");

    return {
      npi: r.number,
      name: fullName.toUpperCase(),
      firstName: (basic.first_name || "").toUpperCase(),
      lastName: (basic.last_name || "").toUpperCase(),
      specialty: taxonomy.desc || "Healthcare Provider",
      address: fullAddress,
      phone: addr.telephone_number || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.postal_code?.substring(0, 5) || "",
      lat: null as number | null,
      lng: null as number | null,
      distance: null as number | null,
    };
  });

  // Post-filter by name to ensure results match what the user searched
  const nameFiltered = doctors.filter((d: any) => nameMatchesSearch(d.name, name));

  // If user provided zip, calculate distances and filter by radius
  if (userCoords && zip) {
    const uniqueZips = [...new Set(nameFiltered.map((d: any) => d.zip).filter(Boolean))] as string[];

    const zipCoordsMap: Record<string, { lat: number; lng: number }> = {};
    zipCoordsMap[zip] = { lat: userCoords.lat, lng: userCoords.lng };

    await Promise.all(
      uniqueZips.map(async (z: string) => {
        if (zipCoordsMap[z]) return;
        const coords = await getZipCoords(z);
        if (coords) {
          zipCoordsMap[z] = { lat: coords.lat, lng: coords.lng };
        }
      })
    );

    for (const doc of nameFiltered) {
      if (doc.zip && zipCoordsMap[doc.zip]) {
        const c = zipCoordsMap[doc.zip];
        doc.lat = c.lat;
        doc.lng = c.lng;
        doc.distance = Math.round(haversine(userCoords.lat, userCoords.lng, c.lat, c.lng) * 10) / 10;
      }
    }

    const filtered = nameFiltered
      .filter((d: any) => d.distance !== null && d.distance <= radius)
      .sort((a: any, b: any) => (a.distance || 999) - (b.distance || 999));

    return res.json({
      total: filtered.length,
      zip,
      radius,
      doctors: filtered,
    });
  }

  // No zip filter - return name-filtered results only
  return res.json({
    total: nameFiltered.length,
    zip: null,
    radius: null,
    doctors: nameFiltered.slice(0, 20),
  });
}
