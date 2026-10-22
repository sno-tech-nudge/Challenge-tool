/** The sections of the "organisation details" card, in order. No numbers are shown on screen;
 *  `short` is the label on the contents links at the top. */
export interface OrgSection {
  key: string;
  title: string;
  note?: string;
  short: string;
}

export const ORG_SECTIONS: OrgSection[] = [
  { key: 'founders', title: 'Founder profiles', short: 'founders' },
  { key: 'brief', title: 'Organisation brief', short: 'brief' },
  { key: 'geography', title: 'Geographical coverage', short: 'geography' },
  { key: 'wfps', title: 'Women foodpreneurs covered', short: 'women foodpreneurs covered' },
  { key: 'markets', title: 'Markets', note: 'market channel shift', short: 'markets' },
  { key: 'partnerships', title: 'Partnerships', short: 'partnerships' },
  { key: 'economics', title: 'Unit economics', short: 'unit economics' },
  { key: 'plan', title: 'Scalability Plan & Vision', short: 'scalability plan' },
  { key: 'swot', title: 'SWOT', short: 'swot' },
];

/** How a section's content is drawn. Real data will fill the same shapes later. */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'subhead'; text: string }
  | { kind: 'people'; rows: { name: string; role: string }[] }
  | { kind: 'brief'; description: string; model: string; barriers: string[] }
  | { kind: 'names'; label: string; items: string[] }
  | { kind: 'panels'; panels: { title: string; total: string; lines: [string, string][] }[] }
  | { kind: 'compare'; before: string; now: string }
  | { kind: 'items'; rows: { title: string; lines: [string, string][] }[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'rows'; rows: { heading: string; text: string }[] }
  | { kind: 'swot'; s: string | string[]; w: string | string[]; o: string | string[]; t: string | string[] };

/** One organisation's details: content per section key. A missing or empty section is not shown. */
export type OrgDetailsData = Record<string, Block[]>;

/** Reads Org.details; anything missing or malformed means "not loaded" (null). */
export function parseDetails(json: string | null | undefined): OrgDetailsData | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as OrgDetailsData) : null;
  } catch {
    return null;
  }
}

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
  brief: [
    {
      kind: 'brief',
      description: 'Sample Foods Private Limited, started in 2021, helps women food entrepreneurs prepare, package and sell home-style food in nearby markets.',
      model: 'Women join a training and mentoring programme, cook in a shared kitchen, and sell through stalls, bulk orders and listings that the organisation arranges for them.',
      barriers: ['Little or no working capital', 'No packaging or food-safety know-how', 'No steady buyers beyond neighbours'],
    },
  ],
  geography: [
    { kind: 'names', label: 'States', items: ['Sample State A', 'Sample State B'] },
    { kind: 'names', label: 'Operational districts', items: ['District One', 'District Two', 'District Three', 'District Four'] },
  ],
  wfps: [
    {
      kind: 'panels',
      panels: [
        { title: 'Individuals', total: '30', lines: [] },
        { title: 'Collectives', total: '6', lines: [] },
      ],
    },
  ],
  markets: [
    { kind: 'compare', before: '2 channels, accessed by the foodpreneurs on their own', now: '5 channels, of which 3 were opened through the organisation' },
    { kind: 'subhead', text: 'Channels the foodpreneurs were already using' },
    {
      kind: 'items',
      rows: [
        { title: 'Neighbourhood and word-of-mouth sales', lines: [['Note', 'Self-accessed. Irregular orders, priced informally.']] },
        { title: 'Local haat/weekly market', lines: [['Note', 'Self-accessed. Seasonal, dependent on travel and stall access.']] },
      ],
    },
    { kind: 'subhead', text: 'Channels opened through the organisation (since intervention)' },
    {
      kind: 'items',
      rows: [
        {
          title: 'Corporate canteen supply',
          lines: [
            ['Opened', 'March 2026'],
            ['Women active', '18 of 40'],
            ['Status', 'Repeat orders for 4 consecutive months'],
            ['What the organisation did', 'Negotiated the contract, set up FSSAI compliance, aggregates orders'],
          ],
        },
        {
          title: 'Online marketplace listing',
          lines: [
            ['Opened', 'May 2026'],
            ['Women active', '12 of 40'],
            ['Status', 'Listed, 60+ orders to date, returns under 5%'],
            ['What the organisation did', 'Packaging, catalogue photography, account management'],
          ],
        },
        {
          title: 'Retail shelf space (2 local stores)',
          lines: [
            ['Opened', 'July 2026'],
            ['Women active', '9 of 40'],
            ['Status', 'Pilot, first restock completed'],
            ['What the organisation did', 'Brokered placement, manages consignment terms'],
          ],
        },
      ],
    },
    { kind: 'subhead', text: 'Existing channels strengthened' },
    { kind: 'p', text: 'Local haat: now selling under a common brand with standard pricing.' },
  ],
  partnerships: [
    { kind: 'subhead', text: 'Active partnerships' },
    { kind: 'bullets', items: ['Mobilisation partner: XXXX', 'Technical partner: YYYYY'] },
    { kind: 'subhead', text: 'Proposed partnerships' },
    { kind: 'bullets', items: ['Mobilisation partner: XXXX', 'Technical partner: YYYYY'] },
  ],
  economics: [
    {
      kind: 'rows',
      rows: [
        { heading: 'Solution model: revenue', text: 'To be filled from the factsheet: who exactly funds the solution work and its runway (grant-based funder model, end-consumer funded model), and which company, person or government.' },
        { heading: 'Organisational cost model', text: 'To be filled from the factsheet: the cost of implementing the model, and the unit cost to the organisation of providing the solution to one new woman.' },
      ],
    },
  ],
  plan: [
    { kind: 'p', text: 'Sample text: over the next year the team plans to double the number of active foodpreneurs, open a second shared kitchen, and test a simple ordering app.' },
    { kind: 'p', text: 'The longer vision is a self-sustaining network of neighbourhood food businesses.' },
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
