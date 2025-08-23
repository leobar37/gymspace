import { UserType } from '@gymspace/shared';
import { Command, CommandRunner } from 'nest-commander';
import { AuthService } from '../core/auth/services/auth.service';
import { PrismaService } from '../core/database/prisma.service';
import { OnboardingService } from '../modules/onboarding/onboarding.service';
import { ProductsService } from '../modules/products/products.service';
import { ClientsService } from '../modules/clients/clients.service';
import { RequestContext } from '../common/services/request-context.service';

@Command({
  name: 'setup-user',
  description: 'Create a default admin user with complete onboarding, products, and clients',
})
export class SetupDefaultUserCommand extends CommandRunner {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
    private readonly productsService: ProductsService,
    private readonly clientsService: ClientsService,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting default setup: user, products, and clients...\n');

    // Debug logging
    console.log('Services:', {
      onboarding: !!this.onboardingService,
      auth: !!this.authService,
      prisma: !!this.prismaService,
    });

    try {
      // Wait for Prisma to be ready
      if (!this.prismaService) {
        throw new Error('PrismaService is not injected properly');
      }
      await this.prismaService.$connect();
      console.log('✅ Connected to database');

      // Default user details for Peru
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
        console.log('✅ Skipping user creation.\n');
        return;
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

      // Step 1: Start onboarding process (creates user, organization, and gym)
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
      console.log('🏢 Organización:', onboardingResult.organization.name);
      console.log('🏋️  Gimnasio:', onboardingResult.gym.name);
      console.log('👤 Usuario:', onboardingResult.user.email);

      // Step 2: Verify email (simulate email verification)
      console.log('\n📧 Verifying email...');

      // Get the verification code from the database
      const userWithCode = await this.prismaService.user.findUnique({
        where: { id: onboardingResult.user.id },
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

      // Step 3: Update gym settings (minimal setup for demo)
      console.log('\n⚙️  Configuring gym settings...');

      // Create a proper RequestContext for service calls
      const context = new RequestContext()
        .forUser({
          id: onboardingResult.user.id,
          email: onboardingResult.user.email,
          name: onboardingResult.user.name,
          userType: UserType.OWNER,
        } as any)
        .withGym({
          id: onboardingResult.gym.id,
          name: onboardingResult.gym.name,
        } as any)
        .withOrganization({
          id: onboardingResult.organization.id,
          name: onboardingResult.organization.name,
        } as any)
        .withPermissions([]);

      await this.onboardingService.updateGymSettings(context, {
        gymId: onboardingResult.gym.id,
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


      // Step 4: Complete guided setup
      console.log('\n🏁 Completing guided setup...');
      await this.onboardingService.completeGuidedSetup(context, {
        gymId: onboardingResult.gym.id,
      });

      console.log('✅ Guided setup completed');

      // Step 5: Initialize default products and services
      console.log('\n📦 Creating default products...');
      const defaultProducts = [
        {
          name: 'Proteína Whey',
          description: 'Proteína de suero de leche premium para desarrollo muscular',
          price: 120.0,
          currency: 'PEN',
          stock: 50,
          barcode: 'PROT001',
          sku: 'WHY-001',
        },
        {
          name: 'Creatina Monohidratada',
          description: 'Creatina pura para mejorar rendimiento y fuerza',
          price: 85.0,
          currency: 'PEN',
          stock: 30,
          barcode: 'CREA001',
          sku: 'CRE-001',
        },
        {
          name: 'BCAA Aminoácidos',
          description: 'Aminoácidos de cadena ramificada para recuperación muscular',
          price: 95.0,
          currency: 'PEN',
          stock: 25,
          barcode: 'BCAA001',
          sku: 'BCA-001',
        },
        {
          name: 'Pre-Entreno',
          description: 'Fórmula pre-entrenamiento para energía y enfoque',
          price: 110.0,
          currency: 'PEN',
          stock: 20,
          barcode: 'PRE001',
          sku: 'PRE-001',
        },
        {
          name: 'Botella de Agua Deportiva',
          description: 'Botella de 1 litro con logo del gimnasio',
          price: 25.0,
          currency: 'PEN',
          stock: 100,
          barcode: 'BOT001',
          sku: 'BOT-001',
        },
      ];

      for (const product of defaultProducts) {
        try {
          // Remove currency from product data as it's not part of the Product model
          const { currency, ...productData } = product;
          await this.productsService.createProduct(context, productData as any);
          console.log(`✅ Producto creado: ${product.name}`);
        } catch (error) {
          console.log(`⚠️  Error creando producto ${product.name}:`, error.message);
        }
      }

      // Step 5.1: Initialize default services
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
          await this.productsService.createService(context, service);
          console.log(`✅ Servicio creado: ${service.name}`);
        } catch (error) {
          console.log(`⚠️  Error creando servicio ${service.name}:`, error.message);
        }
      }

      // Step 6: Initialize default clients
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
          await this.clientsService.createClient(context, client);
          console.log(`✅ Cliente creado: ${client.name}`);
        } catch (error) {
          console.log(`⚠️  Error creando cliente ${client.name}:`, error.message);
        }
      }

      // Display the created user information
      console.log('\n========================================');
      console.log('🎉 USUARIO CREADO EXITOSAMENTE! 🎉');
      console.log('========================================');
      console.log('📧 Correo:', email);
      console.log('🔑 Contraseña:', password);
      console.log('🆔 ID de Usuario:', onboardingResult.user.id);
      console.log('🏢 Organización:', onboardingResult.organization.name);
      console.log('🏋️  Gimnasio:', onboardingResult.gym.name);
      console.log('✉️  Correo Verificado: Sí');
      console.log('🚀 Estado de Configuración: Completado');
      console.log('🔐 Token de Acceso:', onboardingResult.access_token.substring(0, 20) + '...');
      console.log('🇵🇪 País: Perú');
      console.log('💰 Moneda: PEN (Soles)');
      console.log('🕐 Zona Horaria: America/Lima');
      console.log('📦 Productos Creados: 5');
      console.log('🛎️ Servicios Creados: 6');
      console.log('👥 Clientes Creados: 5');
      console.log('========================================\n');

      console.log(
        'ℹ️  Ahora puede iniciar sesión con estas credenciales y comenzar a usar el sistema.',
      );
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
}
