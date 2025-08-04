import { ApiClient } from './client';
import { GymSpaceConfig } from './types';
import {
  AuthResource,
  OrganizationsResource,
  GymsResource,
  ClientsResource,
  MembershipPlansResource,
  ContractsResource,
  EvaluationsResource,
  CheckInsResource,
  InvitationsResource,
  LeadsResource,
  AssetsResource,
  PublicCatalogResource,
  HealthResource,
  OnboardingResource,
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
  public evaluations: EvaluationsResource;
  public checkIns: CheckInsResource;
  public invitations: InvitationsResource;
  public leads: LeadsResource;
  public assets: AssetsResource;
  public publicCatalog: PublicCatalogResource;
  public health: HealthResource;
  public onboarding: OnboardingResource;

  constructor(config: GymSpaceConfig) {
    this.client = new ApiClient(config);

    // Initialize resources
    this.auth = new AuthResource(this.client);
    this.organizations = new OrganizationsResource(this.client);
    this.gyms = new GymsResource(this.client);
    this.clients = new ClientsResource(this.client);
    this.membershipPlans = new MembershipPlansResource(this.client);
    this.contracts = new ContractsResource(this.client);
    this.evaluations = new EvaluationsResource(this.client);
    this.checkIns = new CheckInsResource(this.client);
    this.invitations = new InvitationsResource(this.client);
    this.leads = new LeadsResource(this.client);
    this.assets = new AssetsResource(this.client);
    this.publicCatalog = new PublicCatalogResource(this.client);
    this.health = new HealthResource(this.client);
    this.onboarding = new OnboardingResource(this.client);
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