import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/providers/AppProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GymSpace - Sistema de Gestión de Gimnasios del Futuro',
  description: 'La plataforma todo-en-uno para gestionar tu gimnasio. Control de miembros, contratos, evaluaciones y más. Transforma tu gimnasio con tecnología de vanguardia.',
  keywords: 'gimnasio, gestión, software, miembros, contratos, evaluaciones, fitness, administración',
  authors: [{ name: 'GymSpace' }],
  metadataBase: new URL('https://gymspace.io'),
  openGraph: {
    title: 'GymSpace - Sistema de Gestión de Gimnasios del Futuro',
    description: 'La plataforma todo-en-uno para gestionar tu gimnasio. Control de miembros, contratos, evaluaciones y más.',
    url: 'https://gymspace.io',
    siteName: 'GymSpace',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GymSpace - Sistema de Gestión de Gimnasios',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GymSpace - Sistema de Gestión de Gimnasios del Futuro',
    description: 'La plataforma todo-en-uno para gestionar tu gimnasio.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F57E24',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSpace',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '29',
      highPrice: '79',
      priceCurrency: 'USD',
      offerCount: '3'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '523'
    },
    description: 'Sistema de gestión integral para gimnasios con control de miembros, contratos, evaluaciones y analytics en tiempo real.',
    screenshot: 'https://gymspace.io/screenshot.png',
    softwareVersion: '2.0',
    creator: {
      '@type': 'Organization',
      name: 'GymSpace Inc.',
      url: 'https://gymspace.io'
    }
  }

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}