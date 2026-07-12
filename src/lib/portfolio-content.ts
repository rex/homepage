import yaml from 'yaml';

import portfolioYaml from '../content/portfolio.yaml?raw';
import tierOneYaml from '../content/portfolio-tier-1.yaml?raw';
import tierTwoYaml from '../content/portfolio-tier-2.yaml?raw';
import tierTwoMoreYaml from '../content/portfolio-tier-2-more.yaml?raw';
import tierThreeYaml from '../content/portfolio-tier-3.yaml?raw';
import archiveYaml from '../content/portfolio-archive.yaml?raw';
import archiveLateYaml from '../content/portfolio-archive-late.yaml?raw';

export interface PortfolioMetric {
  v: string;
  k: string;
}

export interface PortfolioProject {
  rank: number;
  id: string;
  tier: 1 | 2 | 3;
  name: string;
  bucket: string;
  tag: string;
  group?: string;
  year: string;
  status: 'active' | 'in-progress' | 'shipped' | 'archived';
  status_kind: 'operational' | 'maintenance' | 'archived';
  stack?: string[];
  pitch: string;
  hook?: string;
  blurb?: string;
  metrics: PortfolioMetric[];
  art?: string;
  visual?: string;
  links?: { live?: string; repo?: string };
}

export interface PortfolioArchiveProject {
  name: string;
  year: string;
  language: string;
  description: string;
  href: string;
}

interface PortfolioCopy {
  title: string;
  description: string;
  nav: { site: string; route: string; availability: string };
  index: {
    issue: string;
    title: string;
    thesis: string;
    summary: string;
    total_label: string;
    curated_label: string;
  };
  labels: {
    heroes: string;
    all_heroes: string;
    index: string;
    filter: string;
    search: string;
    search_placeholder: string;
    tier: string;
    all: string;
    tier_one: string;
    tier_two: string;
    tier_three: string;
    status: string;
    currently_selected: string;
    pitch: string;
    hook: string;
    stack: string;
    metrics: string;
    links: string;
    live_site: string;
    source_repo: string;
    no_results: string;
    historical: string;
    historical_summary: string;
    historical_count: string;
    terminal: string;
    open_case: string;
  };
  tiers: { id: string; label: string }[];
  states: { id: string; label: string }[];
}

export interface PortfolioContent extends PortfolioCopy {
  projects: PortfolioProject[];
  archive: PortfolioArchiveProject[];
}

const portfolioCopy = yaml.parse(portfolioYaml) as PortfolioCopy;
const tierOne = yaml.parse(tierOneYaml) as { projects: PortfolioProject[] };
const tierTwo = yaml.parse(tierTwoYaml) as { projects: PortfolioProject[] };
const tierTwoMore = yaml.parse(tierTwoMoreYaml) as { projects: PortfolioProject[] };
const tierThree = yaml.parse(tierThreeYaml) as { projects: PortfolioProject[] };
const archive = yaml.parse(archiveYaml) as { projects: PortfolioArchiveProject[] };
const archiveLate = yaml.parse(archiveLateYaml) as { projects: PortfolioArchiveProject[] };

const portfolioData: PortfolioContent = {
  ...portfolioCopy,
  projects: [
    ...tierOne.projects,
    ...tierTwo.projects,
    ...tierTwoMore.projects,
    ...tierThree.projects,
  ].sort((left, right) => left.rank - right.rank),
  archive: [...archive.projects, ...archiveLate.projects],
};

export const loadPortfolio = async (): Promise<PortfolioContent> => portfolioData;
