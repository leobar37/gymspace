import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create subscription plans
  const plans = [
    {
      name: 'Gratuito',
      price: {
        PEN: { currency: 'PEN', value: 0 },
      },
      billingFrequency: 'monthly',
      duration: 30,
      durationPeriod: 'DAY',
      maxGyms: 1,
      maxClientsPerGym: 10,
      maxUsersPerGym: 1,
      features: {
        prioritySupport: false,
      },
      description: 'Plan gratuito para comenzar - 30 días de prueba',
    },
    {
      name: 'Básico',
      price: {
        PEN: { currency: 'PEN', value: 110 },
      },
      billingFrequency: 'monthly',
      maxGyms: 1,
      maxClientsPerGym: 100,
      maxUsersPerGym: 3,
      features: {
        prioritySupport: false,
      },
      description: 'Plan ideal para gimnasios pequeños',
    },
    {
      name: 'Premium',
      price: {
        PEN: { currency: 'PEN', value: 295 },
      },
      billingFrequency: 'monthly',
      maxGyms: 3,
      maxClientsPerGym: 500,
      maxUsersPerGym: 10,
      features: {
        prioritySupport: true,
      },
      description: 'Para gimnasios en crecimiento con múltiples ubicaciones',
    },
    {
      name: 'Enterprise',
      price: {
        PEN: { currency: 'PEN', value: 739 },
      },
      billingFrequency: 'monthly',
      maxGyms: 999,
      maxClientsPerGym: 9999,
      maxUsersPerGym: 999,
      features: {
        prioritySupport: true,
      },
      description: 'Solución completa para cadenas de gimnasios',
    },
  ];

  for (const plan of plans) {
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
    });
    
    if (!existingPlan) {
      try {
        await prisma.subscriptionPlan.create({
          data: plan as any,
        });
        console.log(`✅ Created plan: ${plan.name}`);
      } catch (error) {
        console.error(`❌ Failed to create plan ${plan.name}:`, error);
        throw error;
      }
    } else {
      console.log(`⏭️ Plan already exists: ${plan.name}`);
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