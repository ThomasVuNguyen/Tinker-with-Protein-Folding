/**
 * SARS-CoV-2 Spike Protein Data
 * ==============================
 * Canonical Wuhan-Hu-1 strain sequence (UniProt: P0DTC2)
 * This is the same sequence used in the Pfizer-BioNTech BNT162b2 mRNA vaccine.
 * Total length: 1,273 amino acids
 */

export const SPIKE_SEQUENCE =
  'MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDN' +
  'PVLPFNDGVYFASTEKSNIIRGWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVYSS' +
  'ANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQGFSALEPLVDLPIGINITRFQTLHR' +
  'SYLTPGDSSSGWTAGAAAYYVGYLQPRTFLLKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVR' +
  'FPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQI' +
  'APGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPL' +
  'QSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNFNFNGLTGTGVLTESNKKFLPFQQFGRDIADTT' +
  'DAVRDPQTLEILDITPCSFGGVSVITPGTNTSNQVAVLYQDVNCTEVPVAIHADQLTPTWRVYSTGSNVFQTRAGCLIGAEH' +
  'VNNSYECDIPIGAGICASYQTQTNSPRRARSVASQSIIAYTMSLGAENSVAYSNNSIAIPTNFTISVTTEILPVSMTKTSVDC' +
  'TMYICGDSTECSNLLLQYGSFCTQLNRALTGIAVEQDKNTQEVFAQVKQIYKTPPIKDFGGFNFSQILPDPSKPSKRSFIED' +
  'LLFNKVTLADAGFIKQYGDCLGDIAARDLICAQKFNGLTVLPPLLTDEMIAQYTSALLAGTITSGWTFGAGAALQIPFAMQM' +
  'AYRFNGIGVTQNVLYENQKLIANQFNSAIGKIQDSLSSTASALGKLQDVVNQNAQALNTLVKQLSSNFGAISSVLNDILSRL' +
  'DKVEAEVQIDRLITGRLQSLQTYVTQQLIRAAEIRASANLAATKMSECVLGQSKRVDFCGKGYHLMSFPQSAPHGVVFLHVT' +
  'YVPAQEKNFTTAPAICHDGKAHFPREGVFVSNGTHWFVTQRNFYEPQIITTDNTFVSGNCDVVIGIVNNTVYDPLQPELDSF' +
  'KEELDKYFKNHTSPDVDLGDISGINASVVNIQKEIDRLNEVAKNLNESLIDLQELGKYEQYIKWPWYIWLGFIAGLIAIVMV' +
  'TIMLCCMTSCCSCLKGCCSCGSCCKFDEDDSEPVLKGVKLHYT';

export const SPIKE_METADATA = {
  name: 'SARS-CoV-2 Spike Glycoprotein',
  strain: 'Wuhan-Hu-1 (Ancestral)',
  uniprot: 'P0DTC2',
  genbank: 'QHD43416.1',
  pdb: '6M0J',
  length: 1273,
  regions: [
    { name: 'Signal Peptide', start: 1, end: 13, color: '#94a3b8' },
    { name: 'NTD', start: 14, end: 305, color: '#60a5fa' },
    { name: 'RBD', start: 319, end: 541, color: '#f59e0b' },
    { name: 'SD1', start: 542, end: 591, color: '#a78bfa' },
    { name: 'SD2', start: 592, end: 685, color: '#c084fc' },
    { name: 'S2 Fusion', start: 686, end: 1147, color: '#34d399' },
    { name: 'TM Domain', start: 1214, end: 1237, color: '#f87171' },
    { name: 'CT', start: 1238, end: 1273, color: '#fb923c' },
  ],
};

/**
 * Experimentally Validated T-Cell Epitopes (Ground Truth)
 * ========================================================
 * These epitopes were confirmed through:
 *   - IFN-γ ELISpot assays on PBMCs from COVID-19 patients
 *   - Tetramer staining of CD8+ T cells
 *   - Intracellular cytokine staining (ICS)
 *
 * Sources:
 *   - Tarke et al., Cell Reports Medicine 2(2):100204, 2021
 *   - Shomuradova et al., Immunity 53(6):1245-1257, 2020
 *   - Nelde et al., Nature Immunology 22:74–85, 2021
 *   - Saini et al., Cell Reports 36(3):109402, 2021
 *   - Rha et al., Immunity 54(1):44-52, 2021
 */
export const GROUND_TRUTH_EPITOPES = [
  // ── HLA-A*02:01 Validated CD8+ T-Cell Epitopes ──────────────────────
  {
    peptide: 'FVFLVLLPL',
    allele: 'HLA-A*02:01',
    region: 'Signal Peptide',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'Derived from signal peptide cleavage',
  },
  {
    peptide: 'TLDSKTQSL',
    allele: 'HLA-A*02:01',
    region: 'NTD',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'N-terminal domain epitope',
  },
  {
    peptide: 'YLQPRTFLL',
    allele: 'HLA-A*02:01',
    region: 'NTD',
    reference: 'Shomuradova et al., Immunity 2020',
    notes: '⭐ #1 immunodominant epitope for HLA-A*02:01',
    immunodominant: true,
  },
  {
    peptide: 'KIADYNYKL',
    allele: 'HLA-A*02:01',
    region: 'RBD',
    reference: 'Shomuradova et al., Immunity 2020',
    notes: 'Within receptor-binding domain',
  },
  {
    peptide: 'SIIAYTMSL',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'S2 subunit near fusion peptide',
  },
  {
    peptide: 'LLQYGSFCT',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Nelde et al., Nat Immunol 2021',
    notes: 'Conserved across variants',
  },
  {
    peptide: 'ALNTLVKQL',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Nelde et al., Nat Immunol 2021',
    notes: 'Heptad repeat region',
  },
  {
    peptide: 'VLNDILSRL',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'S2 stalk region',
  },
  {
    peptide: 'LITGRLQSL',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'Near HR2 domain',
  },
  {
    peptide: 'RLQSLQTYV',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Nelde et al., Nat Immunol 2021',
    notes: 'HR2 domain epitope',
  },
  {
    peptide: 'RLDKVEAEV',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'S2 connector domain',
  },
  {
    peptide: 'NLNESLIDL',
    allele: 'HLA-A*02:01',
    region: 'S2 Fusion',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'Near transmembrane domain',
  },
  {
    peptide: 'FIAGLIAIV',
    allele: 'HLA-A*02:01',
    region: 'TM Domain',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'Transmembrane anchor epitope',
  },

  // ── HLA-A*24:02 Validated CD8+ T-Cell Epitopes ──────────────────────
  {
    peptide: 'NYNYLYRLF',
    allele: 'HLA-A*24:02',
    region: 'RBD',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'Major A24 epitope in receptor-binding domain',
  },
  {
    peptide: 'QYIKWPWYI',
    allele: 'HLA-A*24:02',
    region: 'S2 Fusion',
    reference: 'Tarke et al., Cell Rep Med 2021',
    notes: 'Near C-terminal domain',
  },
];

/**
 * Available HLA alleles for prediction
 */
export const HLA_ALLELES = [
  { value: 'HLA-A*02:01', label: 'HLA-A*02:01', population: '~40% Caucasian, ~20% globally', isDefault: true },
  { value: 'HLA-A*24:02', label: 'HLA-A*24:02', population: '~20% East Asian', isDefault: false },
  { value: 'HLA-A*01:01', label: 'HLA-A*01:01', population: '~25% Caucasian', isDefault: false },
  { value: 'HLA-A*03:01', label: 'HLA-A*03:01', population: '~20% Caucasian', isDefault: false },
  { value: 'HLA-A*11:01', label: 'HLA-A*11:01', population: '~25% East Asian', isDefault: false },
  { value: 'HLA-B*07:02', label: 'HLA-B*07:02', population: '~15% Caucasian', isDefault: false },
];

export const PEPTIDE_LENGTHS = [8, 9, 10, 11];

/**
 * Binding strength classification based on IEDB percentile rank
 */
export const BINDING_THRESHOLDS = {
  STRONG: 0.5,     // Top 0.5% — strong binder
  MODERATE: 2.0,   // Top 2% — moderate binder (standard IEDB cutoff)
  WEAK: 10.0,      // Top 10% — weak binder
};

/**
 * Find the position of a peptide in the spike sequence (1-indexed)
 */
export function findPeptidePosition(peptide) {
  const idx = SPIKE_SEQUENCE.indexOf(peptide);
  if (idx === -1) return null;
  return { start: idx + 1, end: idx + peptide.length };
}

/**
 * Get the region name for a given position in the spike protein
 */
export function getRegionForPosition(position) {
  for (const region of SPIKE_METADATA.regions) {
    if (position >= region.start && position <= region.end) {
      return region;
    }
  }
  return { name: 'Other', color: '#64748b' };
}
