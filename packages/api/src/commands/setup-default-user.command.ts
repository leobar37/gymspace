import { UserType } from '@gymspace/shared';
import { Command, CommandRunner } from 'nest-commander';
import { AuthService } from '../core/auth/services/auth.service';
import { PrismaService } from '../core/database/prisma.service';
import { OnboardingService } from '../modules/onboarding/onboarding.service';
import { ProductsService } from '../modules/products/products.service';
import { ClientsService } from '../modules/clients/clients.service';
import { GymMembershipPlansService } from '../modules/membership-plans/membership-plans.service';
import { RequestContext } from '../common/services/request-context.service';

@Command({
  name: 'setup-user',
  description: 'Create a default admin user with complete onboarding, products, plans, and clients',
})
export class SetupDefaultUserCommand extends CommandRunner {
  private context: RequestContext;

  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
    private readonly productsService: ProductsService,
    private readonly clientsService: ClientsService,
    private readonly membershipPlansService: GymMembershipPlansService,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting default setup: user, products, plans, and clients...\n');

    try {
      await this.setupDatabase();

      const userInfo = await this.createUserAndOrganization();
      if (!userInfo) {
        console.log('⚠️  User already exists. Skipping setup.');
        return;
      }

      await this.verifyUserEmail(userInfo.user.email, userInfo.user.id);
      await this.setupRequestContext(userInfo);
      await this.configureGym(userInfo.gym.id);
      await this.completeGuidedSetup(userInfo.gym.id);
      await this.createDefaultMembershipPlans();
      await this.createDefaultProducts();
      await this.createDefaultServices();
      await this.createDefaultClients();

      this.displaySetupSummary(userInfo);
    } catch (error: any) {
      console.error('❌ Error setting up default user:', error.message || error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      throw error;
    } finally {
      await this.prismaService.$disconnect();
      console.log('✅ Disconnected from database');
    }
  }

  private async setupDatabase(): Promise<void> {
    if (!this.prismaService) {
      throw new Error('PrismaService is not injected properly');
    }
    await this.prismaService.$connect();
    console.log('✅ Connected to database');
  }

  private async createUserAndOrganization(): Promise<any | null> {
    const email = 'admin@gymspace.pe';
    const password = '182@Alfk3458';
    const name = 'Administrador Principal';
    const phone = '+51999888777';
    const organizationName = 'Gimnasio Elite Lima';

    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists with email:', email);
      console.log('🆔 Existing User ID:', existingUser.id);
      return null;
    }

    console.log('📧 Creating user with email:', email);

    // Get default free subscription plan
    const defaultPlan = await this.prismaService.subscriptionPlan.findFirst({
      where: {
        price: {
          path: ['USD', 'value'],
          equals: 0,
        },
      },
    });

    if (!defaultPlan) {
      throw new Error('No free subscription plan found. Please run database seed first.');
    }

    console.log('📦 Using subscription plan:', defaultPlan.name);
    console.log('\n🎯 Starting onboarding process...');

    const onboardingResult = await this.onboardingService.startOnboarding({
      email,
      password,
      name,
      phone,
      organizationName,
      country: 'PE',
      currency: 'PEN',
      timezone: 'America/Lima',
      subscriptionPlanId: defaultPlan.id,
    });

    console.log('✅ Onboarding started successfully');
    console.log('🏢 Organization:', onboardingResult.organization.name);
    console.log('🏋️  Gym:', onboardingResult.gym.name);
    console.log('👤 User:', onboardingResult.user.email);

    return onboardingResult;
  }

  private async verifyUserEmail(email: string, userId: string): Promise<void> {
    console.log('\n📧 Verifying email...');

    const userWithCode = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { verificationCode: true },
    });

    if (userWithCode?.verificationCode) {
      await this.authService.verifyEmail({
        email,
        code: userWithCode.verificationCode,
      });
      console.log('✅ Email verified successfully');
    } else {
      console.log('⚠️  No verification code found, skipping email verification');
    }
  }

  private async setupRequestContext(userInfo: any): Promise<void> {
    this.context = new RequestContext()
      .forUser({
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name,
        userType: UserType.OWNER,
      } as any)
      .withGym({
        id: userInfo.gym.id,
        name: userInfo.gym.name,
      } as any)
      .withOrganization({
        id: userInfo.organization.id,
        name: userInfo.organization.name,
      } as any)
      .withPermissions([]);
  }

  private async configureGym(gymId: string): Promise<void> {
    console.log('\n⚙️  Configuring gym settings...');

    await this.onboardingService.updateGymSettings(this.context, {
      gymId,
      name: 'Gimnasio Elite Lima',
      address: 'Av. Javier Prado Este 4200',
      city: 'Lima',
      state: 'Lima',
      postalCode: '15023',
      phone: '+51999888777',
      email: 'contacto@gimnasioelite.pe',
      capacity: 150,
      description: 'El mejor gimnasio de Lima con equipamiento de última generación',
      businessHours: {
        monday: { open: '06:00', close: '22:00', closed: false },
        tuesday: { open: '06:00', close: '22:00', closed: false },
        wednesday: { open: '06:00', close: '22:00', closed: false },
        thursday: { open: '06:00', close: '22:00', closed: false },
        friday: { open: '06:00', close: '22:00', closed: false },
        saturday: { open: '08:00', close: '18:00', closed: false },
        sunday: { open: '08:00', close: '18:00', closed: false },
      },
      socialMedia: {
        facebook: 'https://facebook.com/gimnasioelitelima',
        instagram: 'https://instagram.com/gimnasioelitelima',
      },
    });

    console.log('✅ Gym settings configured');
  }
  private async completeGuidedSetup(gymId: string): Promise<void> {
    console.log('\n🏁 Completing guided setup...');
    await this.onboardingService.completeGuidedSetup(this.context, {
      gymId,
    });
    console.log('✅ Guided setup completed');
  }

  private async createDefaultMembershipPlans(): Promise<void> {
    console.log('\n💪 Creating default membership plans...');

    const defaultPlans = [
      {
        name: 'Plan Básico',
        description: 'Acceso completo al gimnasio con horario regular',
        basePrice: 120,
        durationMonths: 1,
        features: [
          'Acceso a todas las máquinas',
          'Acceso a zona de pesas libres',
          'Casillero diario',
          'Horario de 6:00 AM a 10:00 PM',
        ],
        termsAndConditions:
          'Pago mensual anticipado. No incluye clases grupales ni entrenador personal.',
        allowsCustomPricing: true,
        maxEvaluations: 1,
        includesAdvisor: false,
        showInCatalog: true,
      },
      {
        name: 'Plan Premium',
        description: 'Acceso completo con clases grupales incluidas',
        basePrice: 180,
        durationMonths: 1,
        features: [
          'Todo lo incluido en Plan Básico',
          'Clases grupales ilimitadas',
          'Evaluación física mensual',
          'Casillero permanente',
          'Acceso a sauna',
        ],
        termsAndConditions:
          'Pago mensual anticipado. Incluye todas las clases grupales disponibles.',
        allowsCustomPricing: true,
        maxEvaluations: 2,
        includesAdvisor: false,
        showInCatalog: true,
      },
      {
        name: 'Plan VIP',
        description: 'Experiencia completa con entrenador personal',
        basePrice: 350,
        durationMonths: 1,
        features: [
          'Todo lo incluido en Plan Premium',
          '4 sesiones de entrenamiento personal',
          'Plan nutricional personalizado',
          'Evaluación física quincenal',
          'Acceso prioritario a clases',
          'Toalla y bebida isotónica diaria',
          'Parqueo reservado',
        ],
        termsAndConditions:
          'Pago mensual anticipado. Incluye 4 sesiones de 1 hora con entrenador certificado.',
        allowsCustomPricing: true,
        maxEvaluations: 4,
        includesAdvisor: true,
        showInCatalog: true,
      },
    ];

    for (const plan of defaultPlans) {
      try {
        await this.membershipPlansService.createGymMembershipPlan(this.context, plan as any);
        console.log(`✅ Plan created: ${plan.name}`);
      } catch (error) {
        console.log(`⚠️  Error creating plan ${plan.name}:`, error.message);
      }
    }
  }

  private async createDefaultProducts(): Promise<void> {
    console.log('\n📦 Creating default products...');

    const defaultProducts = [
      {
        name: 'Proteína Whey',
        description: 'Proteína de suero de leche premium para desarrollo muscular',
        price: 120.0,
        stock: 50,
        barcode: 'PROT001',
        sku: 'WHY-001',
      },
      {
        name: 'Creatina Monohidratada',
        description: 'Creatina pura para mejorar rendimiento y fuerza',
        price: 85.0,
        stock: 30,
        barcode: 'CREA001',
        sku: 'CRE-001',
      },
      {
        name: 'BCAA Aminoácidos',
        description: 'Aminoácidos de cadena ramificada para recuperación muscular',
        price: 95.0,
        stock: 25,
        barcode: 'BCAA001',
        sku: 'BCA-001',
      },
      {
        name: 'Pre-Entreno',
        description: 'Fórmula pre-entrenamiento para energía y enfoque',
        price: 110.0,
        stock: 20,
        barcode: 'PRE001',
        sku: 'PRE-001',
      },
      {
        name: 'Botella de Agua Deportiva',
        description: 'Botella de 1 litro con logo del gimnasio',
        price: 25.0,
        stock: 100,
        barcode: 'BOT001',
        sku: 'BOT-001',
      },
    ];

    for (const product of defaultProducts) {
      try {
        await this.productsService.createProduct(this.context, product as any);
        console.log(`✅ Product created: ${product.name}`);
      } catch (error) {
        console.log(`⚠️  Error creating product ${product.name}:`, error.message);
      }
    }
  }

  private async createDefaultServices(): Promise<void> {
    console.log('\n🛎️ Creating default services...');

    const defaultServices = [
      {
        name: 'Entrenamiento Personal',
        description: 'Sesión personalizada de entrenamiento con instructor certificado',
        price: 150.0,
      },
      {
        name: 'Evaluación Física Completa',
        description: 'Evaluación antropométrica, composición corporal y plan de entrenamiento',
        price: 80.0,
      },
      {
        name: 'Clase de Yoga',
        description: 'Clase grupal de yoga para flexibilidad y relajación',
        price: 30.0,
      },
      {
        name: 'Clase de Spinning',
        description: 'Entrenamiento cardiovascular intenso en bicicleta estática',
        price: 35.0,
      },
      {
        name: 'Nutrición Deportiva',
        description: 'Consulta nutricional y plan alimenticio personalizado',
        price: 120.0,
      },
      {
        name: 'Masaje Deportivo',
        description: 'Masaje terapéutico para recuperación muscular',
        price: 100.0,
      },
    ];

    for (const service of defaultServices) {
      try {
        await this.productsService.createService(this.context, service);
        console.log(`✅ Service created: ${service.name}`);
      } catch (error) {
        console.log(`⚠️  Error creating service ${service.name}:`, error.message);
      }
    }
  }

  private async createDefaultClients(): Promise<void> {
    console.log('\n👥 Creating default clients...');

    const defaultClients = [
      {
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@example.com',
        phone: '+51987654321',
        documentType: 'dni',
        documentValue: '12345678',
        birthDate: '1990-05-15',
        address: 'Av. Javier Prado 123, San Isidro',
        notes: 'Contacto de emergencia: María Rodriguez - +51987654322',
      },
      {
        name: 'Ana García',
        email: 'ana.garcia@example.com',
        phone: '+51987654323',
        documentType: 'dni',
        documentValue: '87654321',
        birthDate: '1995-08-20',
        address: 'Calle Los Álamos 456, Miraflores',
        notes: 'Contacto de emergencia: Pedro García - +51987654324',
      },
      {
        name: 'Luis Mendoza',
        email: 'luis.mendoza@example.com',
        phone: '+51987654325',
        documentType: 'dni',
        documentValue: '23456789',
        birthDate: '1988-12-10',
        address: 'Jr. Las Flores 789, Surco',
        notes: 'Contacto de emergencia: Sofia Mendoza - +51987654326',
      },
      {
        name: 'María Torres',
        email: 'maria.torres@example.com',
        phone: '+51987654327',
        documentType: 'dni',
        documentValue: '34567890',
        birthDate: '1992-03-25',
        address: 'Av. Larco 321, Barranco',
        notes: 'Contacto de emergencia: Juan Torres - +51987654328',
      },
      {
        name: 'Roberto Vargas',
        email: 'roberto.vargas@example.com',
        phone: '+51987654329',
        documentType: 'dni',
        documentValue: '45678901',
        birthDate: '1985-11-18',
        address: 'Calle Las Palmeras 654, San Borja',
        notes: 'Contacto de emergencia: Carmen Vargas - +51987654330',
      },
    ];

    for (const client of defaultClients) {
      try {
        await this.clientsService.createClient(this.context, client);
        console.log(`✅ Client created: ${client.name}`);
      } catch (error) {
        console.log(`⚠️  Error creating client ${client.name}:`, error.message);
      }
    }
  }

  private displaySetupSummary(userInfo: any): void {
    console.log('\n========================================');
    console.log('🎉 USER CREATED SUCCESSFULLY! 🎉');
    console.log('========================================');
    console.log('📧 Email:', userInfo.user.email);
    console.log('🔑 Password: 182@Alfk3458');
    console.log('🆔 User ID:', userInfo.user.id);
    console.log('🏢 Organization:', userInfo.organization.name);
    console.log('🏋️  Gym:', userInfo.gym.name);
    console.log('✉️  Email Verified: Yes');
    console.log('🚀 Setup Status: Completed');
    console.log('🔐 Access Token:', userInfo.access_token.substring(0, 20) + '...');
    console.log('🇵🇪 Country: Peru');
    console.log('💰 Currency: PEN (Soles)');
    console.log('🕐 Timezone: America/Lima');
    console.log('💪 Membership Plans Created: 3');
    console.log('📦 Products Created: 5');
    console.log('🛎️ Services Created: 6');
    console.log('👥 Clients Created: 5');
    console.log('========================================\n');

    console.log('ℹ️  You can now log in with these credentials and start using the system.');
  }
}
