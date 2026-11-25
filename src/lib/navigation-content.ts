import yaml from 'yaml';

import navigationYaml from '../content/navigation.yaml?raw';

interface NavigationItem {
  number: string;
  label: string;
  href: string;
  matches: string[];
  shortcut: string;
}

interface NavigationContent {
  label: string;
  eyebrow: string;
  shortcut_prefix: string;
  items: NavigationItem[];
}

const navigationData = yaml.parse(navigationYaml) as NavigationContent;

export const loadNavigation = async (): Promise<NavigationContent> => navigationData;
