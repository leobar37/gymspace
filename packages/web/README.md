# GymSpace Landing Page

Landing page futurista para GymSpace, construida con Next.js 14, TypeScript, Tailwind CSS y Framer Motion.

## Características

- ⚡ **Next.js 14 App Router** - Framework React con SSR/SSG
- 🎨 **Diseño Futurista** - Inspirado en Magic UI con efectos glassmorphism
- 🎭 **Animaciones Fluidas** - Implementadas con Framer Motion
- 📱 **Totalmente Responsive** - Diseño adaptativo para todos los dispositivos
- 🔍 **SEO Optimizado** - Meta tags, sitemap, robots.txt y structured data
- 🚀 **Alto Rendimiento** - Optimizado con lazy loading e imágenes next/image

## Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# Instalar dependencias solo del landing
pnpm --filter @gymspace/landing install
```

## Desarrollo

```bash
# Desde la raíz del monorepo
pnpm dev:landing

# O directamente desde el directorio landing
cd packages/landing
pnpm dev
```

La aplicación estará disponible en http://localhost:3000

## Build

```bash
# Desde la raíz del monorepo
pnpm build:landing

# O directamente
cd packages/landing
pnpm build
```

## Estructura

```
landing/
├── app/
│   ├── layout.tsx      # Layout principal con metadata SEO
│   ├── page.tsx        # Página principal
│   ├── globals.css     # Estilos globales y utilidades
│   ├── sitemap.ts      # Generación automática de sitemap
│   └── robots.ts       # Configuración de robots.txt
├── components/
│   ├── Logo.tsx        # Componente del logo
│   └── ui/             # Componentes UI reutilizables
│       ├── AnimatedText.tsx
│       ├── FloatingOrbs.tsx
│       ├── GlassCard.tsx
│       ├── GlowButton.tsx
│       └── ParticleField.tsx
└── public/             # Assets estáticos
```

## Personalización

### Colores

Los colores de la marca están definidos en `tailwind.config.ts`:

```js
gymspace: {
  orange: '#F57E24',
  dark: '#2D3C53',
  'orange-light': '#FF9144',
  'orange-dark': '#E56614',
  'dark-light': '#3D4C63',
  'dark-darker': '#1D2C43',
}
```

### Contenido

- **Hero Section**: Modifica el texto principal en `app/page.tsx`
- **Features**: Actualiza el array `features` con las características
- **Pricing**: Modifica el array `plans` con los planes de precio
- **Footer**: Personaliza los enlaces y contenido del footer

## Despliegue

La landing page está optimizada para desplegar en:

- **Vercel** (recomendado)
- **Netlify**
- **AWS Amplify**
- **Cloudflare Pages**

## Licencia

MIT