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
      icon: Users,
      title: 'Gestión de Miembros',
      description: 'Control completo de clientes, contratos y membresías con trazabilidad total.',
    },
    {
      icon: Activity,
      title: 'Evaluaciones Personalizadas',
      description: 'Sistema avanzado de evaluaciones con seguimiento de progreso y objetivos.',
    },
    {
      icon: FileText,
      title: 'Contratos Inteligentes',
      description: 'Gestión automatizada de contratos con alertas de vencimiento y renovaciones.',
    },
    {
      icon: TrendingUp,
      title: 'Analytics en Tiempo Real',
      description: 'Dashboards interactivos con métricas clave para tomar mejores decisiones.',
    },
    {
      icon: Shield,
      title: 'Seguridad Avanzada',
      description: 'Autenticación robusta con Supabase y permisos granulares por rol.',
    },
    {
      icon: Smartphone,
      title: 'Multiplataforma',
      description: 'Accede desde cualquier dispositivo con nuestra app móvil y web.',
    },
  ]

  const plans = [
    {
      name: 'Básico',
      price: '$29',
      period: '/mes',
      features: [
        '1 Gimnasio',
        'Hasta 100 clientes',
        '3 usuarios',
        '50 evaluaciones/mes',
        'Soporte por email',
      ],
      recommended: false,
    },
    {
      name: 'Premium',
      price: '$79',
      period: '/mes',
      features: [
        '3 Gimnasios',
        'Hasta 500 clientes',
        '10 usuarios',
        '200 evaluaciones/mes',
        'Soporte prioritario',
        'Analytics avanzado',
      ],
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      features: [
        'Gimnasios ilimitados',
        'Clientes ilimitados',
        'Usuarios ilimitados',
        'Evaluaciones ilimitadas',
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
            <GlowButton variant="outline" size="sm">
              Iniciar Sesión
            </GlowButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 text-center rounded-full glassmorphism text-gymspace-orange font-medium text-sm">
              🚀 El futuro de la gestión de gimnasios está aquí
            </span>
          </motion.div>

          <AnimatedText
            text="Transforma tu gimnasio con tecnología de vanguardia"
            className="text-5xl lg:text-7xl font-bold text-white mb-6"
            gradient={false}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto"
          >
            GymSpace es la plataforma todo-en-uno que revoluciona la gestión de gimnasios. 
            Control total de miembros, contratos, evaluaciones y más, todo en un solo lugar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <GlowButton size="lg">
              Comienza Gratis
            </GlowButton>
            <GlowButton variant="outline" size="lg">
              Ver Demo
            </GlowButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">500+</div>
              <div className="text-gray-400">Gimnasios Activos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-gray-400">Miembros Gestionados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-gray-400">Uptime Garantizado</div>
            </div>
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
              Características que <span className="gradient-text">impulsan</span> tu negocio
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              Todo lo que necesitas para gestionar tu gimnasio de manera eficiente y profesional
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
              Elige el plan perfecto para tu negocio. Sin compromisos, cancela cuando quieras.
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
                      <span className="text-4xl font-bold gradient-text">{plan.price}</span>
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
              <Zap className="w-16 h-16 text-gymspace-orange mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Listo para revolucionar tu gimnasio?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Únete a cientos de gimnasios que ya están transformando su gestión con GymSpace. 
                Prueba gratis por 14 días, sin tarjeta de crédito.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GlowButton size="lg">
                  Empieza tu prueba gratis
                </GlowButton>
                <GlowButton variant="outline" size="lg">
                  Agenda una demo
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