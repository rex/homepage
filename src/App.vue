<template>
  <div class="font-body">
    <div class="absolute inset-0 -z-10 overflow-hidden">
      <div class="pointer-events-none absolute -left-32 top-24 h-72 w-72 animate-pulseSoft rounded-full bg-magenta-500/40 blur-3xl"></div>
      <div class="pointer-events-none absolute -right-40 top-1/3 h-96 w-96 animate-float rounded-full bg-neon-500/30 blur-3xl"></div>
      <div class="pointer-events-none absolute left-1/4 bottom-10 h-72 w-72 animate-pulseSoft rounded-full bg-magenta-600/30 blur-3xl"></div>
    </div>

    <header class="sticky top-0 z-40 border-b border-neon-500/20 bg-night/80 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="logo-placeholder">Logo</div>
          <div class="leading-tight">
            <p class="text-xs uppercase tracking-[0.5em] text-neon-300/60">Senior DevOps Engineer</p>
            <p class="text-lg font-semibold text-neon-100">Cyberpunk Nexus</p>
          </div>
        </div>
        <button
          class="sm:hidden btn-neon px-4 py-2 text-xs"
          type="button"
          @click="isMenuOpen = !isMenuOpen"
        >
          {{ isMenuOpen ? 'Close' : 'Menu' }}
        </button>
        <ul class="hidden items-center gap-8 text-sm font-semibold uppercase tracking-[0.4em] sm:flex">
          <li v-for="link in navLinks" :key="link.href">
            <a :href="link.href">{{ link.label }}</a>
          </li>
        </ul>
      </nav>
      <transition name="fade">
        <ul
          v-if="isMenuOpen"
          class="flex flex-col gap-4 border-t border-neon-500/20 bg-night/95 px-6 py-4 text-sm uppercase tracking-[0.4em] sm:hidden"
        >
          <li v-for="link in navLinks" :key="link.href" class="border-b border-neon-500/10 pb-4 last:border-none last:pb-0">
            <a :href="link.href" @click="isMenuOpen = false">{{ link.label }}</a>
          </li>
        </ul>
      </transition>
    </header>

    <main class="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-16 sm:py-24">
      <section id="hero" class="hero-gradient relative overflow-hidden rounded-[2.5rem] border border-neon-500/30 bg-void/60 p-10 sm:p-16">
        <div class="absolute inset-0 -z-10 mix-blend-overlay opacity-40">
          <svg viewBox="0 0 400 400" class="h-full w-full">
            <defs>
              <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
                <rect width="4" height="2" fill="rgba(255,63,215,0.35)" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#scan)" />
          </svg>
        </div>
        <div class="relative grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div class="space-y-8">
            <p class="text-sm uppercase tracking-[0.6em] text-neon-200/80">Hello, I am</p>
            <h1 class="glitch text-4xl font-extrabold uppercase tracking-[0.35em] text-neon-100 sm:text-6xl" data-text="ALEX REZNOV">
              Alex Reznov
            </h1>
            <p class="max-w-xl text-lg text-neon-100/80">
              Senior DevOps Engineer weaving resilient infrastructure, automated pipelines, and lightning-fast deployments for
              next-generation platforms. I transform complex distributed systems into reliable, observable, and secure launchpads.
            </p>
            <div class="flex flex-wrap items-center gap-4">
              <a class="btn-neon" href="#projects">View Projects</a>
              <a class="btn-neon" href="#contact">Contact</a>
            </div>
          </div>
          <div class="relative mx-auto w-full max-w-sm">
            <div class="absolute inset-4 -z-10 animate-float rounded-3xl border border-magenta-500/40"></div>
            <div class="card-neon overflow-hidden">
              <img :src="heroPortrait" alt="Glitched portrait" class="h-full w-full object-cover opacity-90" />
            </div>
          </div>
        </div>
      </section>

      <section id="about" class="section-wrapper">
        <SectionHeading title="About" />
        <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div class="space-y-6 text-neon-100/80">
            <p>
              With over a decade of experience building and scaling infrastructure, I architect automated CI/CD ecosystems that keep
              teams shipping at warp speed. My approach blends SRE principles, platform engineering, and a relentless obsession with
              observability.
            </p>
            <p>
              I specialize in cloud-native operations, Kubernetes platform design, GitOps workflows, and secure supply chains. My work
              empowers teams with self-service tooling, actionable insights, and robust guardrails that make innovation safe and fast.
            </p>
          </div>
          <ul class="space-y-4 text-sm uppercase tracking-[0.5em] text-neon-300/70">
            <li class="flex items-center gap-3">
              <span class="h-px flex-1 bg-neon-400/60"></span>
              Reliability Engineering
            </li>
            <li class="flex items-center gap-3">
              <span class="h-px flex-1 bg-neon-400/60"></span>
              Platform Automation
            </li>
            <li class="flex items-center gap-3">
              <span class="h-px flex-1 bg-neon-400/60"></span>
              Cloud Security
            </li>
          </ul>
        </div>
      </section>

      <section id="skills" class="section-wrapper">
        <SectionHeading title="Skills" />
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="skill in skills"
            :key="skill.name"
            class="card-neon flex items-center gap-4 p-6"
          >
            <img :src="skill.icon" :alt="skill.name" class="h-12 w-12 flex-shrink-0" />
            <div>
              <h3 class="glitch text-xl font-semibold uppercase tracking-[0.3em]" :data-text="skill.name">{{ skill.name }}</h3>
              <p class="mt-2 text-sm text-neon-100/70">{{ skill.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <section id="projects" class="section-wrapper">
        <SectionHeading title="Projects" />
        <div class="grid gap-8 lg:grid-cols-3">
          <article v-for="project in projects" :key="project.title" class="card-neon flex flex-col">
            <div class="overflow-hidden">
              <img :src="project.image" :alt="project.title" class="h-48 w-full object-cover transition duration-500 hover:scale-105" />
            </div>
            <div class="flex flex-1 flex-col gap-4 p-6">
              <h3 class="glitch text-2xl font-semibold uppercase tracking-[0.35em]" :data-text="project.title">{{ project.title }}</h3>
              <p class="text-sm text-neon-100/75">{{ project.description }}</p>
              <ul class="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-neon-200/70">
                <li v-for="tag in project.tags" :key="tag" class="rounded-full border border-neon-500/40 px-3 py-1">{{ tag }}</li>
              </ul>
              <div class="mt-auto">
                <a :href="project.link" class="btn-neon inline-flex w-full justify-center" target="_blank" rel="noopener">View Case Study</a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="contact" class="section-wrapper">
        <SectionHeading title="Contact" />
        <div class="grid gap-10 lg:grid-cols-2">
          <form class="space-y-6">
            <div>
              <label class="block text-xs uppercase tracking-[0.4em] text-neon-200/80">Name</label>
              <input type="text" placeholder="Your name" class="mt-2 w-full rounded-xl border px-4 py-3" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-[0.4em] text-neon-200/80">Email</label>
              <input type="email" placeholder="you@company.com" class="mt-2 w-full rounded-xl border px-4 py-3" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-[0.4em] text-neon-200/80">Message</label>
              <textarea rows="5" placeholder="How can I help?" class="mt-2 w-full rounded-2xl border px-4 py-3"></textarea>
            </div>
            <button type="submit" class="btn-neon w-full">Send Transmission</button>
          </form>
          <div class="space-y-6 text-neon-100/80">
            <p>
              Ready to build high-availability platforms, reliable delivery pipelines, or observability programs that illuminate every
              deployment? Reach out and let’s architect the future together.
            </p>
            <ul class="space-y-3 text-sm uppercase tracking-[0.4em]">
              <li v-for="social in socialLinks" :key="social.name" class="flex items-center justify-between">
                <span>{{ social.name }}</span>
                <a :href="social.href" target="_blank" rel="noopener" class="text-neon-300">{{ social.handle }}</a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-neon-500/10 bg-night/80 py-10 text-center text-xs uppercase tracking-[0.4em] text-neon-200/60">
      &copy; {{ new Date().getFullYear() }} Alex Reznov. Crafted with glitch energy.
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SectionHeading from './components/SectionHeading.vue';

const isMenuOpen = ref(false);

const heroPortrait = new URL('./assets/profile-glitch.svg', import.meta.url).href;

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' }
];

const skills = [
  {
    name: 'Kubernetes',
    description: 'Cluster orchestration, GitOps operations, progressive delivery, and policy as code.',
    icon: new URL('./assets/skills/kubernetes.svg', import.meta.url).href
  },
  {
    name: 'Terraform',
    description: 'Infrastructure-as-Code blueprints, modular platforms, multi-cloud governance.',
    icon: new URL('./assets/skills/terraform.svg', import.meta.url).href
  },
  {
    name: 'Observability',
    description: 'Tracing, metrics, and logging ecosystems built with SLO-driven instrumentation.',
    icon: new URL('./assets/skills/observability.svg', import.meta.url).href
  },
  {
    name: 'CI/CD',
    description: 'Progressive delivery pipelines, automated quality gates, and secure artifact flows.',
    icon: new URL('./assets/skills/cicd.svg', import.meta.url).href
  },
  {
    name: 'Security',
    description: 'Threat modeling, zero-trust networking, secrets management, and SBOM automation.',
    icon: new URL('./assets/skills/security.svg', import.meta.url).href
  },
  {
    name: 'Cloud',
    description: 'Scalable architectures across AWS, Azure, and GCP with cost-efficient resilience.',
    icon: new URL('./assets/skills/cloud.svg', import.meta.url).href
  }
];

const projects = [
  {
    title: 'Neon Spire Platform',
    description:
      'Multi-tenant Kubernetes platform enabling self-service environments, GitOps workflows, and automated compliance guardrails.',
    tags: ['Kubernetes', 'GitOps', 'Policy'],
    link: '#',
    image: new URL('./assets/projects/platform-grid.svg', import.meta.url).href
  },
  {
    title: 'Spectral Pipeline',
    description:
      'Event-driven CI/CD system with ephemeral environments, canary analysis, and advanced supply chain security scanning.',
    tags: ['CI/CD', 'Argo', 'Security'],
    link: '#',
    image: new URL('./assets/projects/pipeline-flow.svg', import.meta.url).href
  },
  {
    title: 'OmniSight Stack',
    description:
      'Unified observability stack with streaming telemetry, adaptive alerting, and executive-level reliability dashboards.',
    tags: ['Observability', 'SRE', 'Dashboards'],
    link: '#',
    image: new URL('./assets/projects/observability-signal.svg', import.meta.url).href
  }
];

const socialLinks = [
  { name: 'LinkedIn', handle: '@alex-reznov', href: '#' },
  { name: 'GitHub', handle: '@areznov', href: '#' },
  { name: 'Twitter', handle: '@reznov_ops', href: '#' }
];
</script>
