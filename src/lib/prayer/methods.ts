/**
 * Prayer-time calculation methods, as published by the Aladhan API
 * (GET https://api.aladhan.com/v1/methods). Ids are Aladhan's `method` param.
 */
export const CALCULATION_METHODS = [
  { id: 3, name: "Muslim World League" },
  { id: 2, name: "Islamic Society of North America (ISNA)" },
  { id: 5, name: "Egyptian General Authority of Survey" },
  { id: 4, name: "Umm Al-Qura University, Makkah" },
  { id: 1, name: "University of Islamic Sciences, Karachi" },
  { id: 7, name: "Institute of Geophysics, University of Tehran" },
  { id: 0, name: "Shia Ithna-Ashari, Leva Institute, Qum" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Majlis Ugama Islam Singapura, Singapore" },
  { id: 12, name: "Union Organization Islamic de France" },
  { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia" },
  { id: 15, name: "Moonsighting Committee Worldwide" },
  { id: 16, name: "Dubai" },
  { id: 17, name: "Jabatan Kemajuan Islam Malaysia (JAKIM)" },
  { id: 18, name: "Tunisia" },
  { id: 19, name: "Algeria" },
  { id: 20, name: "Kementerian Agama Republik Indonesia" },
  { id: 21, name: "Morocco" },
  { id: 22, name: "Comunidade Islamica de Lisboa" },
  { id: 23, name: "Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan" },
] as const;

export const METHOD_IDS = CALCULATION_METHODS.map((m) => m.id) as readonly number[];

/** Rough regional default; users can always change it. */
export function suggestMethod(timezone: string): number {
  const tz = timezone.toLowerCase();
  if (tz.startsWith("america/")) return 2;
  if (/riyadh|aden|qatar|bahrain|kuwait|dubai|muscat/.test(tz)) {
    if (tz.includes("dubai")) return 16;
    if (tz.includes("qatar")) return 10;
    if (tz.includes("kuwait")) return 9;
    return 4;
  }
  if (/cairo|khartoum/.test(tz)) return 5;
  if (/karachi|kolkata|calcutta|dhaka|kabul/.test(tz)) return 1;
  if (tz.includes("istanbul")) return 13;
  if (tz.includes("tehran")) return 7;
  if (tz.includes("singapore")) return 11;
  if (/kuala_lumpur|kuching/.test(tz)) return 17;
  if (/jakarta|makassar|jayapura/.test(tz)) return 20;
  if (tz.includes("paris")) return 12;
  if (tz.includes("moscow")) return 14;
  if (tz.includes("tunis")) return 18;
  if (tz.includes("algiers")) return 19;
  if (tz.includes("casablanca")) return 21;
  if (tz.includes("lisbon")) return 22;
  if (tz.includes("amman")) return 23;
  return 3;
}
