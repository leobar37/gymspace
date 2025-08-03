import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import { SearchCatalogDto } from './dto';
import { ResourceNotFoundException } from '../../common/exceptions';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublicCatalogService {
  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Search gyms in public catalog (CU-018)
   */
  async searchCatalog(dto: SearchCatalogDto) {
    const cacheKey = `catalog:${JSON.stringify(dto)}`;

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.GymWhereInput = {
      isActive: true,
      catalogVisibility: true,
    };

    // Apply search filters
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { amenities: { string_contains: dto.search } },
      ];
    }

    if (dto.city) {
      where.city = { contains: dto.city, mode: 'insensitive' };
    }

    if (dto.state) {
      where.state = dto.state;
    }

    const limit = dto.limit ? parseInt(dto.limit) : 20;
    const offset = dto.offset ? parseInt(dto.offset) : 0;

    // Get gyms with public information only
    const [gyms, total] = await Promise.all([
      this.prismaService.gym.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          latitude: true,
          longitude: true,
          phone: true,
          email: true,
          openingTime: true,
          closingTime: true,
          capacity: true,
          amenities: true,
          catalogDescription: true,
          catalogImages: true,
          _count: {
            select: {
              membershipPlans: {
                where: { status: 'active', showInCatalog: true },
              },
            },
          },
        },
        orderBy: [{ catalogPriority: 'desc' }, { name: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.prismaService.gym.count({ where }),
    ]);

    // Apply distance filter if coordinates provided
    let filteredGyms = gyms;
    if (dto.latitude && dto.longitude && dto.radius) {
      const radius = parseFloat(dto.radius);
      const lat = parseFloat(dto.latitude);
      const lon = parseFloat(dto.longitude);

      filteredGyms = gyms.filter((gym) => {
        if (!gym.latitude || !gym.longitude) return false;

        const distance = this.calculateDistance(lat, lon, gym.latitude, gym.longitude);

        return distance <= radius;
      });
    }

    const result = {
      gyms: filteredGyms,
      pagination: {
        total: dto.latitude && dto.longitude ? filteredGyms.length : total,
        limit,
        offset,
      },
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, result, 3600);

    return result;
  }

  /**
   * Get gym public details by slug (CU-019)
   */
  async getGymBySlug(slug: string) {
    const cacheKey = `catalog:gym:${slug}`;

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const gym = await this.prismaService.gym.findFirst({
      where: {
        slug,
        isActive: true,
        catalogVisibility: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        phone: true,
        email: true,
        openingTime: true,
        closingTime: true,
        capacity: true,
        amenities: true,
        catalogDescription: true,
        catalogImages: true,
        socialMedia: true,
        membershipPlans: {
          where: {
            status: 'active',
            showInCatalog: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            durationMonths: true,
            features: true,
          },
          orderBy: {
            basePrice: 'asc',
          },
        },
        _count: {
          select: {
            gymClients: true,
            collaborators: { where: { status: 'active' } },
          },
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', slug);
    }

    const result = {
      ...gym,
      statistics: {
        totalClients: (gym as any)._count?.clients || 0,
        totalStaff: (gym as any)._count?.collaborators || 0,
      },
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, result, 3600);

    return result;
  }

  /**
   * Get featured gyms
   */
  async getFeaturedGyms(limit = 10) {
    const cacheKey = `catalog:featured:${limit}`;

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const gyms = await this.prismaService.gym.findMany({
      where: {
        isActive: true,
        catalogVisibility: true,
        catalogFeatured: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        state: true,
        catalogDescription: true,
        catalogImages: true,
        _count: {
          select: {
            membershipPlans: {
              where: { status: 'active', showInCatalog: true },
            },
          },
        },
      },
      orderBy: [{ catalogPriority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, gyms, 3600);

    return gyms;
  }

  /**
   * Get cities with gyms
   */
  async getCitiesWithGyms() {
    const cacheKey = 'catalog:cities';

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const cities = await this.prismaService.gym.groupBy({
      by: ['city', 'state'],
      where: {
        isActive: true,
        catalogVisibility: true,
        city: { not: null },
        state: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
    });

    const result = cities.map((item) => ({
      city: item.city,
      state: item.state,
      gymCount: item._count,
    }));

    // Cache for 24 hours
    await this.cacheService.set(cacheKey, result, 86400);

    return result;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
