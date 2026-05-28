import { CONSTELLATIONS, CONSTELLATION_BY_SYSTEM } from "../constellations";
import { STAR_SYSTEMS } from "../systems";

// ---------------------------------------------------------------------------
// Reference catalog — Hipparcos J2000 coordinates (RA in degrees, -180 to +180)
// Used to validate that named stars have astronomically correct positions.
// Tolerance: 2.0° angular separation (generous for data entry differences).
// ---------------------------------------------------------------------------
const CATALOG: Record<string, { ra: number; dec: number; mag?: number }> = {
  // Orion
  Betelgeuse: { ra: 88.7929, dec: 7.4071, mag: 0.42 },
  Rigel: { ra: 78.6345, dec: -8.2016, mag: 0.13 },
  Bellatrix: { ra: 81.2828, dec: 6.3497, mag: 1.64 },
  Saiph: { ra: 86.9391, dec: -9.6696, mag: 2.07 },
  Mintaka: { ra: 83.0017, dec: -0.2991, mag: 2.23 },
  Alnilam: { ra: 84.0534, dec: -1.2019, mag: 1.7 },
  Alnitak: { ra: 85.1897, dec: -1.9426, mag: 1.88 },
  // Cygnus
  Deneb: { ra: -49.642, dec: 45.2803, mag: 1.25 },
  Sadr: { ra: -54.4429, dec: 40.2567, mag: 2.2 },
  Albireo: { ra: -67.3197, dec: 27.9597, mag: 3.08 },
  Gienah: { ra: -63.7563, dec: 45.1308, mag: 2.46 },
  // Canis Major
  Sirius: { ra: 101.2872, dec: -16.7161, mag: -1.46 },
  Wezen: { ra: 107.0979, dec: -26.3932, mag: 1.84 },
  Adhara: { ra: 104.6565, dec: -28.9721, mag: 1.5 },
  Mirzam: { ra: 95.6749, dec: -17.9559, mag: 1.98 },
  Aludra: { ra: 111.0238, dec: -29.3031, mag: 2.45 },
  // Scorpius
  Antares: { ra: -112.6481, dec: -26.432, mag: 1.09 },
  Shaula: { ra: -96.5978, dec: -37.1038, mag: 1.62 },
  Sargas: { ra: -95.6703, dec: -42.9978, mag: 1.87 },
  Dschubba: { ra: -119.9166, dec: -22.6217, mag: 2.29 },
  Graffias: { ra: -118.6407, dec: -19.8055, mag: 2.62 },
  // Eridanus
  Achernar: { ra: 24.4285, dec: -57.2368, mag: 0.46 },
  Cursa: { ra: 76.9624, dec: -5.0864, mag: 2.79 },
  // Carina
  Canopus: { ra: 95.988, dec: -52.6957, mag: -0.72 },
  Miaplacidus: { ra: 138.2999, dec: -69.7172, mag: 1.68 },
  Avior: { ra: 125.6285, dec: -59.5095, mag: 1.86 },
  Aspidiske: { ra: 119.1946, dec: -52.9824, mag: 2.21 },
  // Lyra
  Vega: { ra: -80.7653, dec: 38.7837, mag: 0.03 },
  Sheliak: { ra: -77.48, dec: 33.3627, mag: 3.52 },
  Sulafat: { ra: -75.2641, dec: 32.6896, mag: 3.24 },
  // Aquila
  Altair: { ra: -62.3042, dec: 8.8683, mag: 0.77 },
  Tarazed: { ra: -63.4351, dec: 10.6133, mag: 2.72 },
  Alshain: { ra: -61.1717, dec: 6.4068, mag: 3.71 },
  // Boötes
  Arcturus: { ra: -146.0847, dec: 19.1824, mag: -0.05 },
  Izar: { ra: -138.7533, dec: 27.0742, mag: 2.37 },
  Muphrid: { ra: -151.3288, dec: 18.3977, mag: 2.68 },
  Seginus: { ra: -141.9805, dec: 38.3083, mag: 3.04 },
  // Centaurus
  "Rigil Kentaurus": { ra: -140.0991, dec: -60.835, mag: -0.27 },
  Hadar: { ra: -149.0441, dec: -60.373, mag: 0.61 },
  Menkent: { ra: -148.3294, dec: -36.37, mag: 2.06 },
  // Canis Minor
  Procyon: { ra: 114.8275, dec: 5.225, mag: 0.34 },
  Gomeisa: { ra: 111.7878, dec: 8.2893, mag: 2.9 },
  // Ursa Minor
  Polaris: { ra: 37.9529, dec: 89.2641, mag: 1.98 },
  Kochab: { ra: -137.324, dec: 74.1555, mag: 2.07 },
  Pherkad: { ra: -129.8178, dec: 71.8342, mag: 3.0 },
  // Piscis Austrinus
  Fomalhaut: { ra: -15.5871, dec: -29.6221, mag: 1.16 },
  // Pegasus
  Enif: { ra: -33.9535, dec: 9.875, mag: 2.38 },
  Markab: { ra: -13.8098, dec: 15.2053, mag: 2.49 },
  Scheat: { ra: -14.0565, dec: 28.0828, mag: 2.42 },
  Algenib: { ra: 3.3093, dec: 15.1836, mag: 2.83 },
  Matar: { ra: -19.249, dec: 30.2212, mag: 2.94 },
  // Cepheus
  Alderamin: { ra: -40.3553, dec: 62.5856, mag: 2.45 },
  Alfirk: { ra: -37.835, dec: 70.5607, mag: 3.23 },
  Errai: { ra: -5.1632, dec: 77.6322, mag: 3.21 },
  // Sagittarius
  "Kaus Australis": { ra: -83.9571, dec: -34.3846, mag: 1.79 },
  Nunki: { ra: -76.1836, dec: -26.2968, mag: 2.05 },
  "Kaus Media": { ra: -84.7516, dec: -29.828, mag: 2.7 },
  "Kaus Borealis": { ra: -83.0071, dec: -25.4217, mag: 2.81 },
  Ascella: { ra: -74.3467, dec: -29.8806, mag: 2.59 },
  // Virgo
  Spica: { ra: -158.7017, dec: -11.1613, mag: 0.97 },
  Vindemiatrix: { ra: -164.456, dec: 10.9592, mag: 2.83 },
  Porrima: { ra: -169.5849, dec: -1.4494, mag: 2.74 },
  Heze: { ra: -157.3946, dec: -0.5967, mag: 3.37 },
  // Canes Venatici
  "Cor Caroli": { ra: -165.9935, dec: 38.3183, mag: 2.9 },
  Chara: { ra: -171.5645, dec: 41.3574, mag: 4.26 },
  // Tucana
  "Alpha Tuc": { ra: -25.375, dec: -60.259, mag: 2.86 },
  // Ara
  "Alpha Ara": { ra: -97.0399, dec: -49.8791, mag: 2.95 },
  "Beta Ara": { ra: -98.9507, dec: -55.5317, mag: 2.85 },
  // Pictor
  "Alpha Pic": { ra: 102.048, dec: -61.94, mag: 3.27 },
  "Beta Pic": { ra: 86.821, dec: -51.0662, mag: 3.85 },
  // Ursa Major
  Dubhe: { ra: 165.9316, dec: 61.751, mag: 1.81 },
  Merak: { ra: 165.4603, dec: 56.3823, mag: 2.37 },
  Phecda: { ra: 178.4577, dec: 53.6947, mag: 2.44 },
  Alioth: { ra: -166.4927, dec: 55.9598, mag: 1.77 },
  Mizar: { ra: -159.0186, dec: 54.9254, mag: 2.27 },
  Alkaid: { ra: -153.1148, dec: 49.3133, mag: 1.86 },
  Megrez: { ra: -176.1435, dec: 57.0326, mag: 3.31 },
  // Leo
  Regulus: { ra: 152.0929, dec: 11.9672, mag: 1.35 },
  Denebola: { ra: 177.2649, dec: 14.5721, mag: 2.14 },
  Algieba: { ra: 154.9927, dec: 19.8416, mag: 2.08 },
  Zosma: { ra: 168.527, dec: 20.5237, mag: 2.56 },
  // Taurus
  Aldebaran: { ra: 68.9798, dec: 16.5093, mag: 0.85 },
  Elnath: { ra: 81.5729, dec: 28.6075, mag: 1.65 },
  Alcyone: { ra: 56.8712, dec: 24.1052, mag: 2.87 },
  // Gemini
  Pollux: { ra: 116.3288, dec: 28.026, mag: 1.14 },
  Castor: { ra: 113.6494, dec: 31.8884, mag: 1.58 },
  Alhena: { ra: 99.4278, dec: 16.3992, mag: 1.93 },
  Tejat: { ra: 95.74, dec: 22.5139, mag: 2.87 },
  Mebsuda: { ra: 100.9831, dec: 25.131, mag: 2.98 },
  // Perseus
  Mirfak: { ra: 51.0806, dec: 49.8612, mag: 1.79 },
  Algol: { ra: 47.0421, dec: 40.9556, mag: 2.09 },
  // Andromeda
  Alpheratz: { ra: 2.0969, dec: 29.0904, mag: 2.06 },
  Mirach: { ra: 17.433, dec: 35.6205, mag: 2.05 },
  Almach: { ra: 30.9745, dec: 42.3297, mag: 2.26 },
  // Cassiopeia
  Schedar: { ra: 10.1268, dec: 56.5372, mag: 2.23 },
  Caph: { ra: 2.2943, dec: 59.1499, mag: 2.27 },
  Ruchbah: { ra: 21.4539, dec: 60.2353, mag: 2.68 },
  Segin: { ra: 28.5988, dec: 63.6701, mag: 3.38 },
  // Hercules
  Kornephoros: { ra: -112.4451, dec: 21.4896, mag: 2.77 },
  "Ras Algethi": { ra: -101.3382, dec: 14.39, mag: 3.48 },
};

// IAU official constellation names (all 88)
const IAU_NAMES = new Set([
  "Andromeda",
  "Antlia",
  "Apus",
  "Aquarius",
  "Aquila",
  "Ara",
  "Aries",
  "Auriga",
  "Boötes",
  "Caelum",
  "Camelopardalis",
  "Cancer",
  "Canes Venatici",
  "Canis Major",
  "Canis Minor",
  "Capricornus",
  "Carina",
  "Cassiopeia",
  "Centaurus",
  "Cepheus",
  "Cetus",
  "Chamaeleon",
  "Circinus",
  "Columba",
  "Coma Berenices",
  "Corona Australis",
  "Corona Borealis",
  "Corvus",
  "Crater",
  "Crux",
  "Cygnus",
  "Delphinus",
  "Dorado",
  "Draco",
  "Equuleus",
  "Eridanus",
  "Fornax",
  "Gemini",
  "Grus",
  "Hercules",
  "Horologium",
  "Hydra",
  "Hydrus",
  "Indus",
  "Lacerta",
  "Leo",
  "Leo Minor",
  "Lepus",
  "Libra",
  "Lupus",
  "Lynx",
  "Lyra",
  "Mensa",
  "Microscopium",
  "Monoceros",
  "Musca",
  "Norma",
  "Octans",
  "Ophiuchus",
  "Orion",
  "Pavo",
  "Pegasus",
  "Perseus",
  "Phoenix",
  "Pictor",
  "Pisces",
  "Piscis Austrinus",
  "Puppis",
  "Pyxis",
  "Reticulum",
  "Sagitta",
  "Sagittarius",
  "Scorpius",
  "Sculptor",
  "Scutum",
  "Serpens",
  "Sextans",
  "Taurus",
  "Telescopium",
  "Triangulum",
  "Triangulum Australe",
  "Tucana",
  "Ursa Major",
  "Ursa Minor",
  "Vela",
  "Virgo",
  "Volans",
  "Vulpecula",
]);

function angularSep(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const d1 = toRad(dec1);
  const d2 = toRad(dec2);
  const cosSep =
    Math.sin(d1) * Math.sin(d2) +
    Math.cos(d1) * Math.cos(d2) * Math.cos(toRad(ra1 - ra2));
  return (Math.acos(Math.max(-1, Math.min(1, cosSep))) * 180) / Math.PI;
}

describe("constellations data", () => {
  const systemIds = new Set(STAR_SYSTEMS.map((s) => s.id));

  it("has at least 25 constellations", () => {
    expect(CONSTELLATIONS.length).toBeGreaterThanOrEqual(25);
  });

  it("every constellation is an official IAU constellation", () => {
    for (const c of CONSTELLATIONS) {
      expect(IAU_NAMES.has(c.name)).toBe(true);
    }
  });

  it("every constellation has required fields: id, name, description, funFact, systems, outline", () => {
    for (const c of CONSTELLATIONS) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.funFact).toBeTruthy();
      expect(Array.isArray(c.systems)).toBe(true);
      expect(c.systems.length).toBeGreaterThanOrEqual(0);
      expect(c.outline).toBeDefined();
    }
  });

  it("every outline has at least 1 line segment and at least 2 stars", () => {
    for (const c of CONSTELLATIONS) {
      const outline = c.outline!;
      expect(outline.lines.length).toBeGreaterThanOrEqual(1);
      expect(outline.stars.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("all star RA values are in [-180, 180] and Dec in [-90, 90]", () => {
    for (const c of CONSTELLATIONS) {
      for (const star of c.outline?.stars ?? []) {
        expect(star.ra).toBeGreaterThanOrEqual(-180);
        expect(star.ra).toBeLessThanOrEqual(180);
        expect(star.dec).toBeGreaterThanOrEqual(-90);
        expect(star.dec).toBeLessThanOrEqual(90);
      }
      for (const seg of c.outline?.lines ?? []) {
        for (const [ra, dec] of seg) {
          expect(ra).toBeGreaterThanOrEqual(-180);
          expect(ra).toBeLessThanOrEqual(180);
          expect(dec).toBeGreaterThanOrEqual(-90);
          expect(dec).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it("all star magnitudes are plausible when provided (−2 to 8.5)", () => {
    for (const c of CONSTELLATIONS) {
      for (const star of c.outline?.stars ?? []) {
        if (star.mag !== undefined) {
          expect(star.mag).toBeGreaterThanOrEqual(-2);
          expect(star.mag).toBeLessThanOrEqual(8.5);
        }
      }
    }
  });

  it("all referenced system IDs exist in STAR_SYSTEMS", () => {
    for (const c of CONSTELLATIONS) {
      for (const id of c.systems) {
        expect(systemIds.has(id)).toBe(true);
      }
    }
  });

  it("CONSTELLATION_BY_SYSTEM reverse index is consistent", () => {
    for (const [systemId, constId] of Object.entries(CONSTELLATION_BY_SYSTEM)) {
      const c = CONSTELLATIONS.find((c) => c.id === constId);
      expect(c?.systems).toContain(systemId);
    }
  });

  it("no system ID appears in more than one constellation", () => {
    const seen = new Set<string>();
    for (const c of CONSTELLATIONS) {
      for (const id of c.systems) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });

  it("all constellation IDs are unique", () => {
    const ids = CONSTELLATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // -------------------------------------------------------------------------
  // Reference catalog validation — coordinates checked against Hipparcos J2000
  // Any named star whose name matches a catalog entry must be within 2 degrees.
  // -------------------------------------------------------------------------
  it("named stars match Hipparcos catalog coordinates within 2°", () => {
    const TOLERANCE_DEG = 2.0;
    for (const c of CONSTELLATIONS) {
      for (const star of c.outline?.stars ?? []) {
        const ref = CATALOG[star.name];
        if (!ref) continue;
        const sep = angularSep(star.ra, star.dec, ref.ra, ref.dec);
        expect(sep).toBeLessThanOrEqual(TOLERANCE_DEG);
      }
    }
  });

  it("named stars have magnitudes consistent with catalog when both are provided", () => {
    const TOLERANCE_MAG = 1.0;
    for (const c of CONSTELLATIONS) {
      for (const star of c.outline?.stars ?? []) {
        const ref = CATALOG[star.name];
        if (!ref || star.mag === undefined || ref.mag === undefined) continue;
        expect(Math.abs(star.mag - ref.mag)).toBeLessThanOrEqual(TOLERANCE_MAG);
      }
    }
  });
});
