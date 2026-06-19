<template>
  <div class="relative min-h-screen bg-base-300 text-base-content font-body overflow-hidden">
    <div class="pointer-events-none fixed inset-0 z-30 opacity-20 mix-blend-screen scanline"></div>
    <nav class="navbar bg-base-100/60 backdrop-blur border-b border-primary/40 sticky top-0 z-20">
      <div class="navbar-start">
        <a class="btn btn-ghost normal-case text-xl font-display tracking-[0.3em]" href="#home">
          JD//SYS
        </a>
      </div>
      <div class="navbar-end">
        <ul class="menu menu-horizontal px-1">
          <li><a href="#home" class="font-semibold">Home</a></li>
          <li><a href="#toolkit" class="font-semibold">Toolkit</a></li>
          <li><a href="#signals" class="font-semibold">Signals</a></li>
          <li><a href="#contact" class="font-semibold">Contact</a></li>
        </ul>
      </div>
    </nav>

    <main class="px-6 md:px-16 lg:px-24">
      <section
        id="home"
        class="relative flex min-h-[80vh] flex-col justify-center gap-8 py-24"
      >
        <div class="max-w-4xl space-y-6">
          <p class="uppercase tracking-[0.4em] text-sm text-primary">// establishing secure channel</p>
          <h1 class="glitch text-5xl sm:text-6xl lg:text-7xl font-display text-primary">
            <span aria-hidden="true">Jane Doe</span>
            Jane Doe
            <span aria-hidden="true">Jane Doe</span>
          </h1>
          <h2 class="text-xl sm:text-2xl font-body text-secondary">Senior DevOps Engineer</h2>
          <p class="text-base sm:text-lg text-base-content/80 leading-relaxed">
            Architecting resilient infrastructures, automating deployments, and orchestrating
            high-availability systems across hybrid clouds. Passionate about building secure,
            observable pipelines with lightning-fast feedback loops.
          </p>
          <div class="flex gap-4">
            <a href="#contact" class="btn btn-primary btn-outline uppercase tracking-widest">
              Get In Touch
            </a>
            <a
              href="#signals"
              class="btn btn-secondary btn-outline uppercase tracking-widest"
            >
              View Signals
            </a>
          </div>
        </div>
      </section>

      <section id="toolkit" class="py-24 border-t border-primary/40">
        <div class="max-w-5xl space-y-10">
          <h3 class="glitch text-3xl sm:text-4xl font-display text-secondary">
            <span aria-hidden="true">Toolkit</span>
            Toolkit
            <span aria-hidden="true">Toolkit</span>
          </h3>
          <p class="text-base-content/70 text-lg max-w-3xl">
            Battle-tested technologies leveraged to stabilize, scale, and secure mission-critical
            platforms.
          </p>
          <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="skill in skills"
              :key="skill"
              class="flex items-center justify-center"
            >
              <span class="badge badge-outline badge-lg border-2 border-secondary/60 text-secondary tracking-widest">
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="signals" class="py-24 border-t border-secondary/40">
        <div class="max-w-5xl space-y-12">
          <h3 class="glitch text-3xl sm:text-4xl font-display text-primary">
            <span aria-hidden="true">Signal Logs</span>
            Signal Logs
            <span aria-hidden="true">Signal Logs</span>
          </h3>
          <div class="grid gap-8 md:grid-cols-2">
            <article
              v-for="experience in experiences"
              :key="experience.title"
              class="card bg-base-200/50 border border-primary/30 shadow-lg transition-all duration-300 hover:border-primary hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
            >
              <div class="card-body">
                <h4 class="card-title font-display text-secondary text-2xl">
                  {{ experience.title }}
                </h4>
                <p class="uppercase tracking-[0.3em] text-xs text-primary/80">
                  {{ experience.timeline }}
                </p>
                <p class="text-base-content/70 leading-relaxed">
                  {{ experience.description }}
                </p>
                <div class="card-actions justify-end pt-4">
                  <a
                    :href="experience.link"
                    target="_blank"
                    rel="noopener"
                    class="btn btn-sm btn-accent btn-outline"
                  >
                    View Intel
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>

    <footer
      id="contact"
      class="mt-24 border-t border-primary/40 bg-base-200/40 backdrop-blur py-10"
    >
      <div class="flex flex-col items-center gap-4 text-center">
        <h5 class="glitch text-2xl font-display text-secondary">
          <span aria-hidden="true">Connect</span>
          Connect
          <span aria-hidden="true">Connect</span>
        </h5>
        <p class="text-base-content/70 max-w-2xl">
          Synchronize with Jane across the network. Drop a message, share a challenge, or open a
          secure tunnel for collaboration.
        </p>
        <div class="flex flex-wrap justify-center gap-6 text-sm tracking-[0.3em] uppercase">
          <a href="https://github.com/janedoe" target="_blank" rel="noopener" class="link link-hover text-primary">
            GitHub
          </a>
          <a href="https://linkedin.com/in/janedoe" target="_blank" rel="noopener" class="link link-hover text-secondary">
            LinkedIn
          </a>
          <a href="mailto:jane.doe@example.com" class="link link-hover text-accent">
            Email
          </a>
        </div>
        <p class="text-xs text-base-content/50 tracking-[0.4em]">
          © 2088 Jane Doe. All Systems Operational.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const skills = [
  "Kubernetes",
  "AWS",
  "Terraform",
  "Ansible",
  "Docker",
  "CI/CD",
  "Prometheus",
  "Grafana",
  "Python",
  "Go",
  "Istio",
  "Vault"
]

const experiences = [
  {
    title: "Orbital Ops Platform",
    timeline: "2022 — PRESENT",
    description:
      "Engineered a self-healing multi-cloud platform with GitOps pipelines, progressive delivery, and encrypted secrets federation across clusters.",
    link: "https://example.com/orbital"
  },
  {
    title: "Hyperlane Automation Suite",
    timeline: "2020 — 2022",
    description:
      "Designed automated infrastructure blueprints with Terraform and Ansible, reducing deployment drift and provisioning time by 70%.",
    link: "https://example.com/hyperlane"
  },
  {
    title: "Quantum Signal Mesh",
    timeline: "2017 — 2020",
    description:
      "Implemented observability stacks with Prometheus, Loki, and custom exporters to surface predictive insights from distributed telemetry streams.",
    link: "https://example.com/quantum"
  }
]
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Share+Tech+Mono&display=swap");

:global(html) {
  scroll-behavior: smooth;
}

:global(body) {
  @apply bg-base-300;
  font-family: "Share Tech Mono", monospace;
}

.font-display {
  font-family: "Orbitron", sans-serif;
}

.font-body {
  font-family: "Share Tech Mono", monospace;
}

.glitch {
  position: relative;
  display: inline-block;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.6), 0 0 20px rgba(255, 0, 128, 0.4);
  animation: glow 3s ease-in-out infinite alternate;
}

.glitch span[aria-hidden="true"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  clip-path: inset(0);
  opacity: 0.7;
}

.glitch span:first-child[aria-hidden="true"] {
  animation: glitch-skew 2.5s infinite linear alternate-reverse;
  color: rgba(0, 255, 255, 0.8);
  transform: translate(2px, -2px);
  mix-blend-mode: screen;
}

.glitch span:last-child[aria-hidden="true"] {
  animation: glitch-shift 2s infinite linear alternate;
  color: rgba(255, 0, 128, 0.8);
  transform: translate(-2px, 2px);
  mix-blend-mode: screen;
}

.glitch span:first-child[aria-hidden="true"],
.glitch span:last-child[aria-hidden="true"] {
  pointer-events: none;
}

@keyframes glow {
  0% {
    text-shadow: 0 0 6px rgba(0, 255, 255, 0.4), 0 0 15px rgba(255, 0, 128, 0.2);
  }
  100% {
    text-shadow: 0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(255, 0, 128, 0.5);
  }
}

@keyframes glitch-skew {
  0% {
    clip-path: inset(0 0 80% 0);
    transform: translate(2px, -2px) skew(0deg);
  }
  20% {
    clip-path: inset(10% 0 70% 0);
    transform: translate(-2px, 2px) skew(2deg);
  }
  40% {
    clip-path: inset(40% 0 30% 0);
    transform: translate(2px, -2px) skew(-1deg);
  }
  60% {
    clip-path: inset(5% 0 60% 0);
    transform: translate(-1px, 1px) skew(3deg);
  }
  80% {
    clip-path: inset(60% 0 20% 0);
    transform: translate(3px, -1px) skew(-2deg);
  }
  100% {
    clip-path: inset(10% 0 50% 0);
    transform: translate(-2px, 2px) skew(1deg);
  }
}

@keyframes glitch-shift {
  0% {
    clip-path: inset(80% 0 0 0);
    transform: translate(-2px, 2px);
  }
  25% {
    clip-path: inset(60% 0 10% 0);
    transform: translate(2px, -2px);
  }
  50% {
    clip-path: inset(30% 0 40% 0);
    transform: translate(-1px, 1px);
  }
  75% {
    clip-path: inset(10% 0 70% 0);
    transform: translate(3px, -1px);
  }
  100% {
    clip-path: inset(0 0 90% 0);
    transform: translate(-3px, 3px);
  }
}

.scanline {
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0) 2px,
    rgba(255, 255, 255, 0.04) 3px,
    rgba(0, 0, 0, 0) 4px
  );
  animation: flicker 5s infinite linear;
  pointer-events: none;
}

@keyframes flicker {
  0%,
  100% {
    opacity: 0.05;
  }
  10% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.1;
  }
  70% {
    opacity: 0.2;
  }
  90% {
    opacity: 0.12;
  }
}
</style>
