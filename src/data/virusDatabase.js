/**
 * Curated Virus Database
 * ======================
 * Popular vaccine targets for quick-selection.
 * Each entry maps to a real UniProt accession.
 */

export const FEATURED_VIRUSES = [
  {
    id: 'sars-cov-2-spike',
    virus: 'SARS-CoV-2',
    protein: 'Spike Glycoprotein (S)',
    uniprot: 'P0DTC2',
    organism: 'Severe acute respiratory syndrome coronavirus 2',
    taxId: 2697049,
    length: 1273,
    description: 'The spike protein that the virus uses to enter human cells. Target of all major COVID-19 vaccines (Pfizer, Moderna, J&J).',
    difficulty: 'Beginner',
    knownEpitopes: 13,
    icon: '🦠',
  },
  {
    id: 'sars-cov-2-nucleocapsid',
    virus: 'SARS-CoV-2',
    protein: 'Nucleocapsid (N)',
    uniprot: 'P0DTC9',
    organism: 'Severe acute respiratory syndrome coronavirus 2',
    taxId: 2697049,
    length: 419,
    description: 'Wraps and protects the viral RNA. Highly immunogenic — triggers strong T-cell responses in COVID patients.',
    difficulty: 'Beginner',
    knownEpitopes: 8,
    icon: '🧬',
  },
  {
    id: 'influenza-ha',
    virus: 'Influenza A (H1N1)',
    protein: 'Hemagglutinin (HA)',
    uniprot: 'Q3LZX1',
    organism: 'Influenza A virus (A/Vietnam/1203/2004(H5N1))',
    taxId: 290028,
    length: 568,
    description: 'The "H" in H1N1 — main target of flu vaccines. Lets the virus attach to your cells. Mutates every year, which is why flu shots change annually.',
    difficulty: 'Intermediate',
    knownEpitopes: 6,
    icon: '🤧',
  },
  {
    id: 'hiv-env',
    virus: 'HIV-1',
    protein: 'Envelope glycoprotein gp160',
    uniprot: 'P04578',
    organism: 'Human immunodeficiency virus type 1 group M subtype B',
    taxId: 11706,
    length: 856,
    description: 'The outer coat of HIV — the holy grail of vaccine research. Extremely hard to target because it mutates rapidly and shields itself with sugar molecules.',
    difficulty: 'Advanced',
    knownEpitopes: 10,
    icon: '🔴',
  },
  {
    id: 'ebola-gp',
    virus: 'Ebola',
    protein: 'Glycoprotein (GP)',
    uniprot: 'Q05320',
    organism: 'Zaire ebolavirus',
    taxId: 186538,
    length: 676,
    description: 'The only protein on Ebola\'s surface. Target of the rVSV-ZEBOV vaccine (Ervebo) — the first FDA-approved Ebola vaccine.',
    difficulty: 'Intermediate',
    knownEpitopes: 5,
    icon: '☣️',
  },
  {
    id: 'hpv-l1',
    virus: 'HPV-16',
    protein: 'Major capsid protein L1',
    uniprot: 'P03101',
    organism: 'Human papillomavirus type 16',
    taxId: 333760,
    length: 531,
    description: 'The shell of HPV. The Gardasil vaccine uses virus-like particles made from L1 to prevent cervical cancer.',
    difficulty: 'Intermediate',
    knownEpitopes: 4,
    icon: '🛡️',
  },
  {
    id: 'zika-polyprotein',
    virus: 'Zika',
    protein: 'Envelope protein E',
    uniprot: 'Q32ZE1',
    organism: 'Zika virus',
    taxId: 64320,
    length: 504,
    description: 'The main surface protein of Zika virus. Key target for vaccine candidates currently in clinical trials.',
    difficulty: 'Intermediate',
    knownEpitopes: 3,
    icon: '🦟',
  },
  {
    id: 'rsv-f',
    virus: 'RSV',
    protein: 'Fusion glycoprotein F0',
    uniprot: 'P03420',
    organism: 'Human respiratory syncytial virus A',
    taxId: 208893,
    length: 574,
    description: 'The protein RSV uses to fuse with your cells. Target of the new Arexvy and Abrysvo vaccines approved in 2023.',
    difficulty: 'Beginner',
    knownEpitopes: 5,
    icon: '🫁',
  },
];

/**
 * Ground truth epitopes for validation.
 * These are experimentally confirmed T-cell epitopes from published research.
 * Keyed by UniProt accession.
 */
export const GROUND_TRUTH_BY_PROTEIN = {
  'P0DTC2': {
    source: 'IEDB + Tarke et al., Cell Rep Med 2021; Shomuradova et al., Immunity 2020; Nelde et al., Nat Immunol 2021',
    alleles: {
      'HLA-A*02:01': [
        { peptide: 'FVFLVLLPL', region: 'Signal Peptide', immunodominant: false },
        { peptide: 'TLDSKTQSL', region: 'NTD', immunodominant: false },
        { peptide: 'YLQPRTFLL', region: 'NTD', immunodominant: true },
        { peptide: 'KIADYNYKL', region: 'RBD', immunodominant: false },
        { peptide: 'SIIAYTMSL', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'LLQYGSFCT', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'ALNTLVKQL', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'VLNDILSRL', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'LITGRLQSL', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'RLQSLQTYV', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'RLDKVEAEV', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'NLNESLIDL', region: 'S2 Fusion', immunodominant: false },
        { peptide: 'FIAGLIAIV', region: 'TM Domain', immunodominant: false },
      ],
    },
  },
  'P0DTC9': {
    source: 'Tarke et al., Cell Rep Med 2021; Peng et al., Nat Immunol 2020',
    alleles: {
      'HLA-A*02:01': [
        { peptide: 'LLLDRLNQL', region: 'N-arm', immunodominant: true },
        { peptide: 'LALLLLDRL', region: 'N-arm', immunodominant: false },
        { peptide: 'DLSPRWYFV', region: 'Central', immunodominant: false },
        { peptide: 'GMSRIGMEV', region: 'Dimerization', immunodominant: false },
        { peptide: 'RLNQLESKM', region: 'N-arm', immunodominant: false },
        { peptide: 'ILLNKHIDA', region: 'CTD', immunodominant: false },
        { peptide: 'KTFPPTEPK', region: 'Linker', immunodominant: false },
        { peptide: 'AQFAPSASA', region: 'SR-rich', immunodominant: false },
      ],
    },
  },
};

/**
 * HLA alleles available for prediction
 */
export const HLA_ALLELES = [
  { value: 'HLA-A*02:01', label: 'HLA-A*02:01', population: '~40% Caucasian, ~20% globally', isDefault: true },
  { value: 'HLA-A*24:02', label: 'HLA-A*24:02', population: '~20% East Asian' },
  { value: 'HLA-A*01:01', label: 'HLA-A*01:01', population: '~25% Caucasian' },
  { value: 'HLA-A*03:01', label: 'HLA-A*03:01', population: '~20% Caucasian' },
  { value: 'HLA-A*11:01', label: 'HLA-A*11:01', population: '~25% East Asian' },
  { value: 'HLA-B*07:02', label: 'HLA-B*07:02', population: '~15% Caucasian' },
];

export const PEPTIDE_LENGTHS = [8, 9, 10, 11];

export const BINDING_THRESHOLDS = {
  STRONG: 0.5,
  MODERATE: 2.0,
  WEAK: 10.0,
};
