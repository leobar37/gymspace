import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create subscription plans
  const plans = [
    {
      name: 'Gratuito',
      price: {
        USD: { currency: 'USD', value: 0 }, // Estados Unidos - Dólares
        COP: { currency: 'COP', value: 0 }, // Colombia - Pesos Colombianos
        MXN: { currency: 'MXN', value: 0 }, // México - Pesos Mexicanos
        USD_EC: { currency: 'USD', value: 0 }, // Ecuador - Dólares (moneda oficial)
      },
      billingFrequency: 'monthly',
      duration: 30,
      durationPeriod: 'DAY',
      maxGyms: 1,
      maxClientsPerGym: 10,
      maxUsersPerGym: 1,
      features: {
        evaluations: 5,
        checkIns: true,
        basicReports: false,
        emailSupport: false,
        trialPeriod: 30,
      },
      description: 'Plan gratuito para comenzar - 30 días de prueba',
    },
    {
      name: 'Básico',
      price: {
        USD: { currency: 'USD', value: 29.99 }, // Estados Unidos - ~$30 USD
        COP: { currency: 'COP', value: 129900 }, // Colombia - ~$130K COP (1 USD ≈ 4,330 COP)
        MXN: { currency: 'MXN', value: 549 }, // México - ~$549 MXN (1 USD ≈ 18.3 MXN)
        USD_EC: { currency: 'USD', value: 29.99 }, // Ecuador - Misma tarifa USD
      },
      billingFrequency: 'monthly',
      maxGyms: 1,
      maxClientsPerGym: 100,
      maxUsersPerGym: 3,
      features: {
        evaluations: 50,
        checkIns: true,
        basicReports: true,
        emailSupport: true,
      },
      description: 'Plan ideal para gimnasios pequeños',
    },
    {
      name: 'Premium',
      price: {
        USD: { currency: 'USD', value: 79.99 }, // Estados Unidos - ~$80 USD
        COP: { currency: 'COP', value: 349900 }, // Colombia - ~$350K COP (1 USD ≈ 4,330 COP)
        MXN: { currency: 'MXN', value: 1449 }, // México - ~$1,449 MXN (1 USD ≈ 18.3 MXN)
        USD_EC: { currency: 'USD', value: 79.99 }, // Ecuador - Misma tarifa USD
      },
      billingFrequency: 'monthly',
      maxGyms: 3,
      maxClientsPerGym: 500,
      maxUsersPerGym: 10,
      features: {
        evaluations: 200,
        checkIns: true,
        advancedReports: true,
        financialReports: true,
        prioritySupport: true,
        customBranding: true,
      },
      description: 'Para gimnasios en crecimiento con múltiples ubicaciones',
    },
    {
      name: 'Enterprise',
      price: {
        USD: { currency: 'USD', value: 199.99 }, // Estados Unidos - ~$200 USD
        COP: { currency: 'COP', value: 879900 }, // Colombia - ~$880K COP (1 USD ≈ 4,330 COP)
        MXN: { currency: 'MXN', value: 3599 }, // México - ~$3,599 MXN (1 USD ≈ 18.3 MXN)
        USD_EC: { currency: 'USD', value: 199.99 }, // Ecuador - Misma tarifa USD
      },
      billingFrequency: 'monthly',
      maxGyms: 999, // Unlimited
      maxClientsPerGym: 9999, // Unlimited
      maxUsersPerGym: 999, // Unlimited
      features: {
        evaluations: 9999, // Unlimited
        checkIns: true,
        advancedReports: true,
        financialReports: true,
        dedicatedSupport: true,
        customBranding: true,
        apiAccess: true,
        whiteLabel: true,
      },
      description: 'Solución completa para cadenas de gimnasios',
    },
  ];

  for (const plan of plans) {
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
    });
    
    if (!existingPlan) {
      await prisma.subscriptionPlan.create({
        data: plan,
      });
    }
  }

  console.log('✅ Subscription plans created');

  // Create default roles
  const roles = [
    {
      name: 'Owner',
      permissions: ['ALL'], // Owner has all permissions
      description: 'Propietario del gimnasio con acceso completo',
      canManageEvaluations: true,
    },
    {
      name: 'Manager',
      permissions: [
        'GYMS_READ',
        'COLLABORATORS_READ',
        'CLIENTS_CREATE',
        'CLIENTS_READ',
        'CLIENTS_UPDATE',
        'CONTRACTS_CREATE',
        'CONTRACTS_READ',
        'EVALUATIONS_CREATE',
        'EVALUATIONS_READ',
        'EVALUATIONS_UPDATE',
        'CHECKINS_CREATE',
        'CHECKINS_READ',
        'REPORTS_VIEW',
      ],
      description: 'Encargado con permisos de gestión',
      canManageEvaluations: true,
    },
    {
      name: 'Staff',
      permissions: [
        'CLIENTS_READ',
        'CHECKINS_CREATE',
        'CHECKINS_READ',
      ],
      description: 'Personal con permisos básicos',
      canManageEvaluations: false,
    },
    {
      name: 'Advisor',
      permissions: [
        'CLIENTS_READ',
        'EVALUATIONS_CREATE',
        'EVALUATIONS_READ',
        'EVALUATIONS_UPDATE',
      ],
      description: 'Asesor personal con acceso a evaluaciones',
      canManageEvaluations: true,
    },
  ];

  for (const role of roles) {
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name },
    });
    
    if (!existingRole) {
      await prisma.role.create({
        data: role,
      });
    }
  }

  console.log('✅ Roles created');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });