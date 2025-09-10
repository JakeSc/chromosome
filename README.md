# Chromosome

Interactive 3D visual experiments and components built with modern web technologies.

## Features

- **Interactive 3D Periodic Table** - CSS 3D transforms with element animations
- **Visual Experiments Collection** - Creative Three.js and WebGL projects:
  - Mercury Lake - Liquid wave simulations with custom shaders
  - Liquid Glass Sphere - Volumetric rendering effects  
  - T1000 Blob - Dynamic morphing geometry
  - Flame/Smoke Background - Particle system effects

## Live Demo

Visit [chromosome.dev](https://chromosome.dev) to explore the interactive experiences.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Deployment**: Vercel with continuous deployment

## Visual Projects

Each visual project is accessible at `/visual/{number}`:

- `/visual/1` - Mercury Lake wave system
- `/visual/2` - Liquid Glass Sphere
- `/visual/3` - T1000 Blob morphing
- `/visual/4` - Flame/Smoke effects

## Architecture

```
src/
├── app/              # Next.js app router pages
│   ├── visual/       # Visual experiment routes
│   └── page.tsx      # Homepage (Periodic Table)
├── components/       # Reusable components
└── visual/          # Visual project documentation
```
