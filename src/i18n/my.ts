import type { Translations } from "./types";
import { my_nav, my_hero } from "./my_nav_hero";
import { my_features } from "./my_features";
import { my_palm, my_numerology } from "./my_palm_numerology";
import { my_astrology } from "./my_astrology";
import { my_dashboard, my_auth, my_footer, my_common } from "./my_dashboard_auth";

const my: Translations = {
  nav: my_nav,
  hero: my_hero,
  features: my_features,
  palm: my_palm,
  numerology: my_numerology,
  astrology: my_astrology,
  dashboard: my_dashboard,
  auth: my_auth,
  footer: my_footer,
  common: my_common,
};

export default my;
