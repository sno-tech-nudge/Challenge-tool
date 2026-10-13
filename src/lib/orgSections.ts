/** The headings of the "organisation details" card, taken from the working sheet's column headings
 *  (same wording, same order). `num` + `title` + `note` together read exactly like the sheet heading.
 *  `short` is only used for the contents links at the top. */
export interface OrgSection {
  key: string;
  num: string;
  title: string;
  note?: string;
  short: string;
}

export const ORG_SECTIONS: OrgSection[] = [
  { key: 'founders', num: 'F', title: 'Founder profiles', short: 'founders' },
  { key: 'profile', num: '1', title: 'Brief profile', note: 'challenger datasheet', short: 'profile' },
  { key: 'barriers', num: '2', title: 'Barriers and solution package', note: 'services provided to WFPs', short: 'barriers' },
  { key: 'geography', num: '3.1', title: 'Coverage: operational area (geography) for TABC', short: 'geography' },
  { key: 'wfp-types', num: '3.2', title: 'Coverage: WFP types onboarded (individual/group and existing/new)', short: 'wfp types' },
  { key: 'onboarding', num: '4', title: "WFP's onboarding process", short: 'onboarding' },
  { key: 'distribution', num: '5', title: 'Distribution of foodpreneurs, based on months in challenge', short: 'distribution' },
  { key: 'markets', num: '6', title: 'List / typology / category of markets (existing/new)', short: 'markets' },
  { key: 'partnerships', num: '7', title: 'Partnerships and collaboration at challenger level', short: 'partnerships' },
  { key: 'plan', num: '8', title: 'Plan and vision', short: 'plan' },
  { key: 'backup', num: '9', title: 'Backup data table for all scoring items (quantitative aspects)', short: 'backup data' },
  { key: 'scoresheets', num: '10', title: 'Individual score sheets with remarks', short: 'score sheets' },
  { key: 'swot', num: '11', title: 'SWOT', short: 'swot' },
];

/** How a section's content is drawn. Real data will fill the same shapes later. */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'people'; rows: { name: string; role: string }[] }
  | { kind: 'pairs'; rows: { barrier: string; support: string }[] }
  | { kind: 'facts'; rows: [string, string][] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'bars'; rows: [string, number][] }
  | { kind: 'columns'; cols: { title: string; items: string[] }[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'remarks'; rows: { who: string; text: string; score: string }[] }
  | { kind: 'swot'; s: string; w: string; o: string; t: string };

/** PLACEHOLDER TEXT ONLY, so the layout can be judged. Entirely made up; no real organisation data.
 *  Replace with each organisation's own content when the real data is loaded. */
export const SAMPLE: Record<string, Block[]> = {
  founders: [
    {
      kind: 'people',
      rows: [
        { name: 'Sample Founder', role: 'Founder and CEO' },
        { name: 'Sample Co-founder', role: 'Co-founder, head of operations' },
      ],
    },
  ],
  profile: [
    { kind: 'p', text: 'Sample Foods Private Limited is a company started in 2021. It helps women food entrepreneurs prepare, package and sell home-style food in nearby markets.' },
    { kind: 'p', text: 'This paragraph is sample text so you can see how a longer brief profile reads on the page.' },
  ],
  barriers: [
    {
      kind: 'pairs',
      rows: [
        { barrier: 'No access to working capital', support: 'Small revolving loans and a savings group' },
        { barrier: 'No packaging or food-safety knowledge', support: 'Training and a shared packing kitchen' },
        { barrier: 'No steady buyers', support: 'Weekly stalls and bulk orders from offices' },
      ],
    },
  ],
  geography: [
    { kind: 'p', text: 'Sample text: active in four districts across two states, with the main hub in one district and satellite clusters in the others.' },
    {
      kind: 'facts',
      rows: [
        ['States', '2'],
        ['Districts', '4'],
      ],
    },
  ],
  'wfp-types': [
    {
      kind: 'facts',
      rows: [
        ['Foodpreneurs onboarded', '48'],
        ['Individuals', '30  (22 existing, 8 new)'],
        ['Groups', '6  (4 existing, 2 new)'],
      ],
    },
  ],
  onboarding: [
    {
      kind: 'steps',
      items: ['Community meeting and interest form', 'Home visit with a taste and hygiene check', 'Three-day training, then a trial stall', 'Enrolment with a mentor for the first month'],
    },
  ],
  distribution: [
    {
      kind: 'bars',
      rows: [
        ['0 to 3 months', 14],
        ['4 to 6 months', 19],
        ['7 to 12 months', 15],
      ],
    },
  ],
  markets: [
    {
      kind: 'columns',
      cols: [
        { title: 'Existing', items: ['Weekly local market', 'Two office canteens', 'School fair'] },
        { title: 'New', items: ['Railway station stall', 'Online group-order list'] },
      ],
    },
  ],
  partnerships: [
    {
      kind: 'bullets',
      items: ['Local bank for small loans', 'Food-safety trainer', 'District women’s federation', 'Retail chain, on a trial basis'],
    },
  ],
  plan: [
    { kind: 'p', text: 'Sample text: over the next year the team plans to double the number of active foodpreneurs, open a second shared kitchen, and test a simple ordering app.' },
    { kind: 'p', text: 'The longer vision is a self-sustaining network of neighbourhood food businesses.' },
  ],
  backup: [
    {
      kind: 'facts',
      rows: [
        ['Active foodpreneurs', '48'],
        ['Average monthly sales per foodpreneur', 'sample value'],
        ['Repeat customers', 'sample value'],
        ['Survival after 6 months', 'sample value'],
      ],
    },
  ],
  scoresheets: [
    {
      kind: 'remarks',
      rows: [
        { who: 'Juror 1', text: 'Strong community trust, needs clearer pricing.', score: '32 / 40' },
        { who: 'Juror 2', text: 'Good training model, small market reach so far.', score: '30 / 40' },
      ],
    },
  ],
  swot: [
    {
      kind: 'swot',
      s: 'Sample strength: close ties with the community.',
      w: 'Sample weakness: depends on a small core team.',
      o: 'Sample opportunity: growing demand for home-style food.',
      t: 'Sample threat: rising ingredient costs.',
    },
  ],
};
