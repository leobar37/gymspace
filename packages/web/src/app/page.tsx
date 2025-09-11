'use client'

import { motion } from 'framer-motion'
import { 
  Activity, 
  Users, 
  FileText, 
  TrendingUp, 
  Shield, 
  Smartphone,
  Calendar,
  BarChart3,
  CheckCircle,
  Star,
  Zap,
  Globe
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { GlowButton } from '@/components/ui/GlowButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedText } from '@/components/ui/AnimatedText'
import { FloatingOrbs } from '@/components/ui/FloatingOrbs'
import { ParticleField } from '@/components/ui/ParticleField'

export default function Home() {
  const features = [
    {
      icon: Smartphone,
      title: 'App Móvil Nativa',
      description: 'Gestiona tu gimnasio desde tu celular, donde estés, cuando quieras.',
    },
    {
      icon: Users,
      title: 'Control de Miembros',
      description: 'Registra clientes, contratos y membresías en segundos desde tu móvil.',
    },
    {
      icon: FileText,
      title: 'Contratos Digitales',
      description: 'Crea y gestiona contratos directamente desde la app con firma digital.',
    },
    {
      icon: TrendingUp,
      title: 'Métricas al Instante',
      description: 'Visualiza el estado de tu negocio con un toque en tu pantalla.',
    },
    {
      icon: Zap,
      title: 'Rápido y Simple',
      description: 'Interfaz intuitiva diseñada para que hagas todo en pocos toques.',
    },
    {
      icon: Shield,
      title: 'Datos Seguros',
      description: 'Tus datos protegidos en la nube, con respaldo automático diario.',
    },
  ]

  const plans = [
    {
      name: 'Básico',
      price: 'S/50',
      period: '/mes',
      features: [
        '1 Gimnasio',
        'Hasta 100 clientes',
        'Hasta 3 usuarios',
        'Gestión de inventario',
        'Soporte por email',
      ],
      recommended: false,
    },
    {
      name: 'Premium',
      price: 'S/90',
      period: '/mes',
      features: [
        'Hasta 3 Gimnasios',
        'Hasta 500 clientes por gimnasio',
        'Hasta 10 usuarios por gimnasio',
        'Reportes avanzados',
        'Soporte prioritario',
        'Dashboard consolidado',
      ],
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: 'Habla con nosotros',
      period: '',
      features: [
        'Gimnasios ilimitados',
        'Clientes ilimitados',
        'Usuarios ilimitados',
        'API para integraciones',
        'Soporte dedicado 24/7',
        'Personalización completa',
      ],
      recommended: false,
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gymspace-dark relative overflow-hidden">
      <ParticleField />
      <FloatingOrbs />

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo variant="lg" />
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Características
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Precios
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <span className="inline-block px-4 py-2 rounded-full glassmorphism text-gymspace-orange font-medium text-sm">
                  📱 App móvil para gimnasios modernos
                </span>
              </motion.div>

              <AnimatedText
                text="No necesitas un sistema complejo"
                className="text-4xl lg:text-6xl font-bold text-white mb-4"
                gradient={false}
              />
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-3xl lg:text-5xl font-bold mb-6"
              >
                <span className="gradient-text">Necesitas un sistema eficiente</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xl text-gray-300 mb-10"
              >
                GymSpace es la app móvil que simplifica la gestión de tu gimnasio. 
                Controla miembros, contratos y ventas desde tu celular, sin complicaciones.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
              >
                <GlowButton size="lg">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Descarga la App
                </GlowButton>
                <GlowButton variant="outline" size="lg">
                  Ver Demo
                </GlowButton>
              </motion.div>

              {/* App Store Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex gap-4 justify-center lg:justify-start"
              >
                <div className="px-4 py-2 rounded-lg glassmorphism text-sm text-gray-300">
                  <span className="text-white font-semibold">iOS</span> • App Store
                </div>
                <div className="px-4 py-2 rounded-lg glassmorphism text-sm text-gray-300">
                  <span className="text-white font-semibold">Android</span> • Google Play
                </div>
              </motion.div>
            </div>

            {/* Right Column - Video/Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-sm lg:max-w-md">
                {/* Phone Frame */}
                <div className="relative z-10 rounded-[3rem] glassmorphism p-2">
                  <div className="rounded-[2.5rem] bg-gray-900 p-4">
                    {/* Video Placeholder */}
                    <div className="aspect-[9/19.5] rounded-[2rem] bg-gradient-to-br from-gymspace-orange/20 to-gymspace-dark flex items-center justify-center">
                      <div className="text-center p-8">
                        <Smartphone className="w-16 h-16 text-gymspace-orange mx-auto mb-4" />
                        <p className="text-white font-semibold text-lg mb-2">Demo de la App</p>
                        <p className="text-gray-400 text-sm">Video próximamente</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-gymspace-orange/30 to-transparent blur-3xl -z-10" />
              </div>
            </motion.div>
          </div>

          {/* No Complexity Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true }}
            className="mt-20 max-w-5xl mx-auto"
          >
            <GlassCard className="p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                    Olvídate de la <span className="text-red-400 line-through">complejidad</span>
                  </h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-red-500/20 mt-1">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300 text-lg">
                          <span className="text-red-400 font-semibold">Sin tutoriales interminables</span>
                          <br />
                          <span className="text-sm text-gray-400">Interfaz tan intuitiva que no necesitas manual</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-red-500/20 mt-1">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300 text-lg">
                          <span className="text-red-400 font-semibold">Sin consultorías costosas</span>
                          <br />
                          <span className="text-sm text-gray-400">Empieza a usar la app en minutos, no en semanas</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-red-500/20 mt-1">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300 text-lg">
                          <span className="text-red-400 font-semibold">Sin funciones que nunca usarás</span>
                          <br />
                          <span className="text-sm text-gray-400">Solo lo esencial para gestionar tu gimnasio</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-red-500/20 mt-1">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-300 text-lg">
                          <span className="text-red-400 font-semibold">Sin instalaciones complicadas</span>
                          <br />
                          <span className="text-sm text-gray-400">Descarga desde la tienda y listo</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="glassmorphism rounded-2xl p-8">
                    <CheckCircle className="w-16 h-16 text-gymspace-orange mx-auto lg:mx-0 mb-4" />
                    <h4 className="text-2xl font-bold text-white mb-4">
                      La solución es <span className="gradient-text">simple</span>
                    </h4>
                    <p className="text-lg text-gray-300 mb-6">
                      Descarga la app y empieza a gestionar tu gimnasio en <span className="text-gymspace-orange font-semibold">5 minutos</span>
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <CheckCircle className="w-5 h-5 text-gymspace-orange" />
                        <span className="text-white">Setup instantáneo</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <CheckCircle className="w-5 h-5 text-gymspace-orange" />
                        <span className="text-white">Soporte 24/7 por WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <CheckCircle className="w-5 h-5 text-gymspace-orange" />
                        <span className="text-white">Actualizaciones automáticas</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <GlowButton size="lg" className="w-full lg:w-auto">
                        <Smartphone className="w-5 h-5 mr-2" />
                        Pruébalo Ahora
                      </GlowButton>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              Todo en tu <span className="gradient-text">bolsillo</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              Una app móvil potente y simple para gestionar tu gimnasio desde cualquier lugar
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassCard key={index} delay={index * 0.1}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gymspace-orange/20">
                    <feature.icon className="w-6 h-6 text-gymspace-orange" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              Planes que se <span className="gradient-text">adaptan</span> a tu gimnasio
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              Precios para Perú. Elige el plan perfecto para tu negocio. Sin compromisos, cancela cuando quieras.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${plan.recommended ? 'scale-105' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="px-4 py-1 rounded-full bg-gymspace-orange text-white text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" /> Recomendado
                    </span>
                  </div>
                )}
                <GlassCard hover={false} className={`h-full ${plan.recommended ? 'gradient-border' : ''}`}>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className={`${plan.name === 'Enterprise' ? 'text-2xl' : 'text-4xl'} font-bold gradient-text`}>
                        {plan.price}
                      </span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center justify-center gap-2 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-gymspace-orange flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <GlowButton
                      variant={plan.recommended ? 'primary' : 'outline'}
                      className="w-full"
                    >
                      {plan.name === 'Enterprise' ? 'Contactar Ventas' : 'Comenzar Ahora'}
                    </GlowButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          
          {/* Free Trial Announcement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-block px-6 py-3 rounded-full glassmorphism">
              <span className="text-gymspace-orange font-semibold text-lg">🎉 1 MES GRATIS</span>
              <span className="text-white ml-2">para todos los planes</span>
            </div>
            <div className="mt-6">
              <GlowButton size="lg">
                Comienza ahora gratis, sin tarjeta de crédito
              </GlowButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 rounded-full glassmorphism text-gymspace-orange font-medium text-sm mb-6">
              🚀 Próximamente
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Escalamos hasta la <span className="gradient-text">Luna</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Sé uno de los primeros en recibir estas actualizaciones revolucionarias
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Web Platform Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <GlassCard hover={false} className="h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gymspace-orange/20 flex-shrink-0">
                    <Globe className="w-8 h-8 text-gymspace-orange" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">Versión Web</h3>
                    <p className="text-gray-300 mb-4">
                      Accede a GymSpace desde cualquier navegador. Panel administrativo completo, 
                      reportes avanzados y gestión multi-gimnasio desde tu computadora.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Dashboard Avanzado</span>
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Reportes Detallados</span>
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Multi-gimnasio</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Catalog Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <GlassCard hover={false} className="h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gymspace-orange/20 flex-shrink-0">
                    <FileText className="w-8 h-8 text-gymspace-orange" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">Catálogo Digital</h3>
                    <p className="text-gray-300 mb-4">
                      Comparte tus planes, horarios y servicios con un link único. 
                      Tus clientes podrán ver toda la información de tu gimnasio desde su celular.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Link Compartible</span>
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Planes y Precios</span>
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Info del Gym</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Automated Sales Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <GlassCard hover={false} className="h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gymspace-orange/20 flex-shrink-0">
                    <Zap className="w-8 h-8 text-gymspace-orange" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">Ventas Automatizadas</h3>
                    <p className="text-gray-300 mb-4">
                      Sistema inteligente de ventas que trabaja 24/7. Chatbot integrado, 
                      seguimiento automático de leads y conversión optimizada con IA.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Chatbot IA</span>
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">Email Marketing</span>
                      <span className="px-3 py-1 rounded-full glassmorphism text-sm text-gray-300">CRM Integrado</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Early Access Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <GlassCard className="max-w-3xl mx-auto p-8 gradient-border">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-gymspace-orange mr-2" />
                <Star className="w-8 h-8 text-gymspace-orange" />
                <Star className="w-8 h-8 text-gymspace-orange ml-2" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Nuestros clientes actuales tendrán <span className="gradient-text">acceso exclusivo</span>
              </h3>
              <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
                Si ya eres parte de la familia GymSpace, serás de los primeros en disfrutar estas innovaciones. 
                Sin costo adicional durante el período de lanzamiento.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="px-6 py-3 rounded-full glassmorphism">
                  <CheckCircle className="w-5 h-5 text-gymspace-orange inline mr-2" />
                  <span className="text-white font-medium">Acceso Beta Garantizado</span>
                </div>
                <div className="px-6 py-3 rounded-full glassmorphism">
                  <CheckCircle className="w-5 h-5 text-gymspace-orange inline mr-2" />
                  <span className="text-white font-medium">Sin Costo Extra</span>
                </div>
                <div className="px-6 py-3 rounded-full glassmorphism">
                  <CheckCircle className="w-5 h-5 text-gymspace-orange inline mr-2" />
                  <span className="text-white font-medium">Soporte Prioritario</span>
                </div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-sm text-gray-400 mt-6"
              >
                ¿Aún no eres cliente? Comienza hoy con 1 mes gratis y asegura tu lugar en el futuro
              </motion.p>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="text-center p-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Smartphone className="w-16 h-16 text-gymspace-orange mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Listo para simplificar tu gestión?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Únete a cientos de gimnasios que ya gestionan todo desde su celular. 
                Prueba gratis por 30 días, sin tarjeta de crédito.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GlowButton size="lg">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Descarga la App Gratis
                </GlowButton>
                <GlowButton variant="outline" size="lg">
                  Solicita una demo
                </GlowButton>
              </div>
            </motion.div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="lg" className="mb-4" />
              <p className="text-gray-400">
                La plataforma todo-en-uno para la gestión moderna de gimnasios.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integraciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sobre nosotros</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Carreras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Seguridad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 GymSpace. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Globe className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400 text-sm">Disponible en múltiples países</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}