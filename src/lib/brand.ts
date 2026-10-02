/** Official domains — same app & backend; nginx serves one build for all. */
export const BRAND_DOMAINS = ["myastrosutra.live", "cookstudio.live"] as const;

export const BRAND_PRIMARY_DOMAIN = BRAND_DOMAINS[0];

export function resolveBrandDomain(hostname?: string): string {
  const raw =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : "");
  const host = raw.replace(/^www\./i, "");
  return (BRAND_DOMAINS as readonly string[]).includes(host) ? host : BRAND_PRIMARY_DOMAIN;
}

export const BRAND = {
  NAME: "My Astro Sutra",
  TAGLINE: "Ancient Vedic Wisdom · Modern AI Guidance",
  PRIMARY_DOMAIN: BRAND_PRIMARY_DOMAIN,
  DOMAINS: BRAND_DOMAINS,
  get DOMAIN() {
    return resolveBrandDomain();
  },
  COMPANY: "Forte Digital Solutions LLP",
  LOGO: "/logo.png",
  VIDEO_HERO:
    "https://vz-8af39f0e-519.b-cdn.net/85cd5368-8eb6-4210-aa7e-1464f618cd3d/play_720p.mp4",
  VIDEO_PRELOADER:
    "https://vz-8af39f0e-519.b-cdn.net/6af8afd6-9dc4-4ccf-ac6e-16e06f0cc429/play_720p.mp4",
  AUDIO_HOME_MANTRA:
    "https://play365thumb.b-cdn.net/sounovamusic-gayatri-mantra-493174.mp3",
} as const;
