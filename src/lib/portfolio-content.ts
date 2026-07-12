import yaml from 'yaml';

import portfolioYaml from '../content/portfolio.yaml?raw';

interface PortfolioProject {
  id: string;
  title: string;
  group: string;
  type: string;
  depth: string;
  state: string;
  preview: string;
  subtitle: string;
  featured?: boolean;
  selected?: boolean;
  thesis?: string;
  stack?: string;
  artifacts?: { index: string; label: string }[];
}

interface PortfolioContent {
  title: string;
  description: string;
  nav: { site: string; route: string; availability: string };
  index: { issue: string; title: string; summary: string; total_label: string };
  labels: {
    flagship: string;
    all_flagship: string;
    jump: string;
    type: string;
    depth: string;
    view: string;
    all: string;
    selected: string;
    count_by_type: string;
    thesis: string;
    stack: string;
    artifacts: string;
    terminal: string;
    source: string;
  };
  filters: { types: string[]; depths: string[]; views: string[] };
  types: { id: string; label: string }[];
  states: { id: string; label: string }[];
  groups: { label: string; letters: string }[];
  projects: PortfolioProject[];
}

const portfolioData = yaml.parse(portfolioYaml) as PortfolioContent;

export const loadPortfolio = async (): Promise<PortfolioContent> => portfolioData;
