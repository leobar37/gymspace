import { ApiClient } from './client';
import { GymSpaceConfig } from './types';
import {
  AuthResource,
  OrganizationsResource,
  GymsResource,
  ClientsResource,
  MembershipPlansResource,
  ContractsResource,
  DashboardResource,
  EvaluationsResource,
  CheckInsResource,
  InvitationsResource,
  LeadsResource,
  AssetsResource,
  FilesResource,
  PublicCatalogResource,
  HealthResource,
  OnboardingResource,
  ProductsResource,
  SalesResource,
  SuppliersResource,
  UsersResource,
  SubscriptionsResource,
  PaymentMethodsResource,
} from './resources';

export class GymSpaceSdk {
  private client: ApiClient;
  
  // Resources
  public auth: AuthResource;
  public organizations: OrganizationsResource;
  public gyms: GymsResource;
  public clients: ClientsResource;
  public membershipPlans: MembershipPlansResource;
  public contracts: ContractsResource;
  public dashboard: DashboardResource;
  public evaluations: EvaluationsResource;
  public checkIns: CheckInsResource;
  public invitations: InvitationsResource;
  public leads: LeadsResource;
  public assets: AssetsResource;
  public files: FilesResource;
  public publicCatalog: PublicCatalogResource;
  public health: HealthResource;
  public onboarding: OnboardingResource;
  public products: ProductsResource;
  public sales: SalesResource;
  public suppliers: SuppliersResource;
  public users: UsersResource;
  public subscriptions: SubscriptionsResource;
  public paymentMethods: PaymentMethodsResource;

  constructor(config: GymSpaceConfig) {
    this.client = new ApiClient(config);
    
    // Initialize resources
    this.auth = new AuthResource(this.client);
    this.organizations = new OrganizationsResource(this.client);
    this.gyms = new GymsResource(this.client);
    this.clients = new ClientsResource(this.client);
    this.membershipPlans = new MembershipPlansResource(this.client);
    this.contracts = new ContractsResource(this.client);
    this.dashboard = new DashboardResource(this.client);
    this.evaluations = new EvaluationsResource(this.client);
    this.checkIns = new CheckInsResource(this.client);
    this.invitations = new InvitationsResource(this.client);
    this.leads = new LeadsResource(this.client);
    this.assets = new AssetsResource(this.client);
    this.files = new FilesResource(this.client);
    this.publicCatalog = new PublicCatalogResource(this.client);
    this.health = new HealthResource(this.client);
    this.onboarding = new OnboardingResource(this.client);
    this.products = new ProductsResource(this.client);
    this.sales = new SalesResource(this.client);
    this.suppliers = new SuppliersResource(this.client);
    this.users = new UsersResource(this.client);
    this.subscriptions = new SubscriptionsResource(this.client);
    this.paymentMethods = new PaymentMethodsResource(this.client);
  }

  /**
   * Set the authentication token
   */
  setAuthToken(token: string): void {
    this.client.setAuthToken(token);
  }


  /**
   * Set the current gym context
   */
  setGymId(gymId: string): void {
    this.client.setGymId(gymId);
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.client.clearAuth();
  }

  /**
   * Get the underlying API client
   */
  getClient(): ApiClient {
    return this.client;
  }
}