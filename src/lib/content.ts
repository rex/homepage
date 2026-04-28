import yaml from 'yaml';

import heroYaml from '../content/hero.yaml?raw';
import practiceYaml from '../content/practice-areas.yaml?raw';
import careerYaml from '../content/career-log.yaml?raw';
import faqYaml from '../content/faq.yaml?raw';
import contactYaml from '../content/contact.yaml?raw';
import errorYaml from '../content/error-pages.yaml?raw';

export interface HeroContent {
  name: string;
  title: string;
  tagline: string;
  status: string;
  bio: string;
  short_tagline: string;
  meta_description: string;
  signal_sentence: string;
}

export interface PracticeArea {
  slug: string;
  name: string;
  status: 'operational' | 'maintenance' | 'archived';
  years: string;
  sparkline: number[];
  tools: string[];
  recent: string;
  recent_link?: string;
  expanded: string;
}

export interface CareerEntry {
  version: string;
  period: string;
  role: string;
  title_arc?: string;
  employer: string;
  location?: string;
  summary: string;
}

export interface FaqContent {
  intro: string;
  faqs: { q: string; a: string }[];
}

export interface ContactContent {
  primary_email: string;
  links: { label: string; href: string; value: string }[];
  location: string;
  availability: string;
  humans_txt: string;
  security_txt: string;
}

export interface ErrorPagesContent {
  '404': { headline: string; body: string; actions: { label: string; href: string }[] };
  '500': { headline: string; body: string; actions: { label: string; href: string }[] };
}

const heroData = yaml.parse(heroYaml) as HeroContent;
const practiceData = yaml.parse(practiceYaml) as { areas: PracticeArea[] };
const careerData = yaml.parse(careerYaml) as { entries: CareerEntry[] };
const faqData = yaml.parse(faqYaml) as FaqContent;
const contactData = yaml.parse(contactYaml) as ContactContent;
const errorData = yaml.parse(errorYaml) as ErrorPagesContent;

export const loadHero = async (): Promise<HeroContent> => heroData;
export const loadPracticeAreas = async (): Promise<PracticeArea[]> => practiceData.areas;
export const loadCareer = async (): Promise<CareerEntry[]> => careerData.entries;
export const loadFaq = async (): Promise<FaqContent> => faqData;
export const loadContact = async (): Promise<ContactContent> => contactData;
export const loadErrorPages = async (): Promise<ErrorPagesContent> => errorData;
