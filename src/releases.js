/**
 * Release notes, newest first. To announce a release:
 *   1. bump "version" in package.json,
 *   2. add an entry here with the same version,
 *   3. deploy.
 * The newest entry is shown as "What's new" to every visitor for 48 hours after the deployment
 * that carries it, once per browser. Open tabs notice the deployment and refresh themselves.
 */
export const RELEASES = [
  {
    version: '2.4.0',
    title: 'Lights, stage, launch',
    highlights: [
      'A launch-style intro the first time you visit (skip it any time, or press Esc)',
      'A soft spotlight follows your pointer across the home stage',
      'Our pitch now lights up word by word as you scroll, beside a close-up of this week’s tools',
      'Section titles settle into place as you reach them',
    ],
  },
  {
    version: '2.3.0',
    title: 'Carbon edition',
    highlights: [
      'A carbon-black, monochrome look with light headlines and hairline frames',
      'A giant HANDYAI wordmark behind the home spotlight that drifts as you scroll',
      'Tool logos rest in greyscale and take their colour when you reach for them',
      'Section links are back in the header on wide screens',
      'Pages now load on demand, so the home page opens faster',
    ],
  },
  {
    version: '2.2.0',
    title: 'The shelf got a makeover',
    highlights: [
      'A calmer dark storefront with a cleaner, more readable typeface',
      'Navigation now lives on the right edge (bottom on phones), with prices and theme beside it',
      'Listings that read like a shop: ratings, savings badges and a one-tap "try it"',
      'Tool pages laid out like product pages, with billing you can switch in place',
      'A new HandyAI logo, and buttons that bloom from wherever you point',
    ],
  },
  {
    version: '2.1.0',
    title: 'A brand-new launch look',
    highlights: [
      'A bold black, white and red design with big italic headlines',
      'A home spotlight that shows the trending tools one by one, with live prices',
      'Pick a tool from the spotlight, or swipe through them on your phone',
      'Smoother motion everywhere: cards lift, logos tilt and pages slide in',
    ],
  },
  {
    version: '2.0.0',
    title: 'HandyAI 2.0 is here',
    highlights: [
      'A new dark look with floating controls and smoother animations',
      'Live marketplace prices in rupees or dollars, per month, quarter or year',
      'Ask the AI Chat by voice and get tools picked for your profession',
      'Track every AI subscription you pay for in one place',
      'Send us suggestions: they go straight to the team building HandyAI',
    ],
  },
]

/** How long "What's new" stays up after a release is deployed. */
export const WHATS_NEW_WINDOW_MS = 48 * 60 * 60 * 1000
