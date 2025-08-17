# Database Entities Reference

This document provides a comprehensive overview of all database entities (models) in the Gymspace application. The schema is implemented using Prisma ORM with PostgreSQL as the database.

## Table of Contents

### Core Entities

- [SubscriptionPlan](#subscriptionplan)
- [User](#user)
- [Organization](#organization)
- [Gym](#gym)
- [Role](#role)
- [Collaborator](#collaborator)
- [Invitation](#invitation)

### Client Management

- [GymClient](#gymclient)
- [GymMembershipPlan](#gymmembershipplan)
- [Contract](#contract)
- [CheckIn](#checkin)
- [Evaluation](#evaluation)
- [EvaluationComment](#evaluationcomment)

### Lead Management

- [Lead](#lead)

### Asset Management

- [Asset](#asset)
- [File](#file)

### Inventory & Sales

- [ProductCategory](#productcategory)
- [Product](#product)
- [Supplier](#supplier)
- [Sale](#sale)
- [SaleItem](#saleitem)

### Enums

- [System Enums](#system-enums)

## Entity Relationships Overview

```
Organization 1--* Gym
User 1--* Organization (owner)
User 1--* Collaborator
Gym 1--* Collaborator
Role 1--* Collaborator
Gym 1--* GymClient
Gym 1--* GymMembershipPlan
GymClient 1--* Contract
GymMembershipPlan 1--* Contract
GymClient 1--* CheckIn
GymClient 1--* Evaluation
Collaborator 1--* Evaluation (advisor)
Evaluation 1--* EvaluationComment
Gym 1--* Lead
Gym 1--* Asset
Gym 1--* ProductCategory
ProductCategory 1--* Product
Gym 1--* Sale
Sale 1--* SaleItem
Product 1--* SaleItem
```

## Core Entities

### SubscriptionPlan

Defines subscription tiers and pricing for organizations using the platform.

| Field            | Type            | Attributes           | Description                                 |
| ---------------- | --------------- | -------------------- | ------------------------------------------- |
| id               | String          | @id @default(uuid()) | Unique identifier                           |
| name             | String          |                      | Plan name (e.g., "Basic", "Premium")        |
| price            | Json            |                      | Pricing structure with currency and amounts |
| billingFrequency | String          |                      | How often billing occurs                    |
| duration         | Int?            |                      | Plan duration in specified period           |
| durationPeriod   | DurationPeriod? |                      | Period unit (DAY, MONTH)                    |
| maxGyms          | Int             |                      | Maximum number of gyms allowed              |
| maxClientsPerGym | Int             |                      | Maximum clients per gym                     |
| maxUsersPerGym   | Int             |                      | Maximum users per gym                       |
| features         | Json            |                      | Available features list                     |
| description      | String?         |                      | Plan description                            |
| createdByUserId  | String?         |                      | User who created the plan                   |
| updatedByUserId  | String?         |                      | User who last updated the plan              |
| createdAt        | DateTime        | @default(now())      | Creation timestamp                          |
| updatedAt        | DateTime        | @updatedAt           | Last update timestamp                       |
| deletedAt        | DateTime?       |                      | Soft delete timestamp                       |

**Relations:**

- One-to-many with Organization
- Many-to-one with User (createdBy, updatedBy)

### User

Represents all users in the system including owners and collaborators.

| Field                     | Type      | Attributes           | Description                              |
| ------------------------- | --------- | -------------------- | ---------------------------------------- |
| id                        | String    | @id @default(uuid()) | Unique identifier                        |
| email                     | String    | @unique              | User's email address                     |
| password                  | String?   |                      | Password (optional, handled by Supabase) |
| name                      | String    |                      | User's full name                         |
| phone                     | String?   |                      | Phone number                             |
| birthDate                 | DateTime? |                      | Date of birth                            |
| userType                  | UserType  |                      | owner or collaborator                    |
| emailVerifiedAt           | DateTime? |                      | Email verification timestamp             |
| verificationCode          | String?   |                      | Email verification code                  |
| verificationCodeExpiresAt | DateTime? |                      | Verification code expiry                 |
| createdByUserId           | String?   |                      | User who created this user               |
| updatedByUserId           | String?   |                      | User who last updated this user          |
| createdAt                 | DateTime  | @default(now())      | Creation timestamp                       |
| updatedAt                 | DateTime  | @updatedAt           | Last update timestamp                    |
| deletedAt                 | DateTime? |                      | Soft delete timestamp                    |

**Relations:**

- One-to-many with Organization (as owner)
- One-to-many with Collaborator
- One-to-many with Invitation (sent and accepted)
- Extensive audit trail relations with all entities

### Organization

Top-level entity representing a business or company using the platform.

| Field              | Type               | Attributes           | Description                       |
| ------------------ | ------------------ | -------------------- | --------------------------------- |
| id                 | String             | @id @default(uuid()) | Unique identifier                 |
| ownerUserId        | String             |                      | Owner user reference              |
| name               | String             |                      | Organization name                 |
| organizationCode   | String             | @unique              | Unique organization code          |
| subscriptionPlanId | String             |                      | Current subscription plan         |
| subscriptionStatus | SubscriptionStatus |                      | Subscription status               |
| subscriptionStart  | DateTime           |                      | Subscription start date           |
| subscriptionEnd    | DateTime           |                      | Subscription end date             |
| country            | String             |                      | Organization's country            |
| currency           | String             |                      | Default currency                  |
| timezone           | String             |                      | Organization timezone             |
| settings           | Json?              |                      | Organization-specific settings    |
| createdByUserId    | String             |                      | User who created the organization |
| updatedByUserId    | String?            |                      | User who last updated             |
| createdAt          | DateTime           | @default(now())      | Creation timestamp                |
| updatedAt          | DateTime           | @updatedAt           | Last update timestamp             |
| deletedAt          | DateTime?          |                      | Soft delete timestamp             |

**Relations:**

- Many-to-one with User (owner)
- Many-to-one with SubscriptionPlan
- One-to-many with Gym

### Gym

Individual gym or fitness center within an organization.

| Field               | Type      | Attributes           | Description                |
| ------------------- | --------- | -------------------- | -------------------------- |
| id                  | String    | @id @default(uuid()) | Unique identifier          |
| organizationId      | String    |                      | Parent organization        |
| name                | String    |                      | Gym name                   |
| slug                | String    | @unique              | URL-friendly identifier    |
| address             | String?   |                      | Physical address           |
| city                | String?   |                      | City location              |
| state               | String?   |                      | State/province             |
| postalCode          | String?   |                      | Postal/ZIP code            |
| latitude            | Float?    |                      | GPS latitude               |
| longitude           | Float?    |                      | GPS longitude              |
| description         | String?   |                      | Gym description            |
| phone               | String?   |                      | Contact phone              |
| email               | String?   |                      | Contact email              |
| openingTime         | String?   |                      | Daily opening time         |
| closingTime         | String?   |                      | Daily closing time         |
| capacity            | Int?      |                      | Maximum capacity           |
| amenities           | Json?     |                      | Available amenities list   |
| settings            | Json?     |                      | Gym-specific settings      |
| isActive            | Boolean   | @default(true)       | Active status              |
| gymCode             | String    | @unique              | Unique gym code            |
| profilePhotoId      | String?   |                      | Profile photo asset ID     |
| coverPhotoId        | String?   |                      | Cover photo asset ID       |
| evaluationStructure | Json?     |                      | Custom evaluation fields   |
| catalogVisibility   | Boolean   | @default(false)      | Public catalog visibility  |
| catalogDescription  | String?   |                      | Public catalog description |
| catalogImages       | Json?     |                      | Public catalog images      |
| catalogFeatured     | Boolean   | @default(false)      | Featured in catalog        |
| catalogPriority     | Int       | @default(0)          | Catalog display priority   |
| socialMedia         | Json?     |                      | Social media links         |
| createdByUserId     | String    |                      | User who created the gym   |
| updatedByUserId     | String?   |                      | User who last updated      |
| createdAt           | DateTime  | @default(now())      | Creation timestamp         |
| updatedAt           | DateTime  | @updatedAt           | Last update timestamp      |
| deletedAt           | DateTime? |                      | Soft delete timestamp      |

**Relations:**

- Many-to-one with Organization
- One-to-many with Collaborator, GymClient, GymMembershipPlan, CheckIn, Evaluation, Contract, Lead, Asset, ProductCategory, Product, Supplier, Sale

### Role

Defines permission sets and access levels for users within gyms.

| Field                | Type      | Attributes           | Description                      |
| -------------------- | --------- | -------------------- | -------------------------------- |
| id                   | String    | @id @default(uuid()) | Unique identifier                |
| name                 | String    |                      | Role name                        |
| permissions          | Json      |                      | Permission flags                 |
| description          | String?   |                      | Role description                 |
| canManageEvaluations | Boolean   | @default(false)      | Evaluation management permission |
| createdByUserId      | String?   |                      | User who created the role        |
| updatedByUserId      | String?   |                      | User who last updated            |
| createdAt            | DateTime  | @default(now())      | Creation timestamp               |
| updatedAt            | DateTime  | @updatedAt           | Last update timestamp            |
| deletedAt            | DateTime? |                      | Soft delete timestamp            |

**Relations:**

- One-to-many with Collaborator
- One-to-many with Invitation

### Collaborator

Represents staff members working at a gym with specific roles.

| Field           | Type               | Attributes           | Description                 |
| --------------- | ------------------ | -------------------- | --------------------------- |
| id              | String             | @id @default(uuid()) | Unique identifier           |
| userId          | String             |                      | Associated user account     |
| gymId           | String             |                      | Gym where they work         |
| roleId          | String             |                      | Assigned role               |
| status          | CollaboratorStatus |                      | Employment status           |
| hiredDate       | DateTime?          |                      | Hire date                   |
| invitationId    | String?            |                      | Related invitation          |
| profilePhotoId  | String?            |                      | Profile photo asset ID      |
| coverPhotoId    | String?            |                      | Cover photo asset ID        |
| description     | String?            |                      | Bio/description             |
| specialties     | Json?              |                      | Areas of expertise          |
| createdByUserId | String             |                      | User who created the record |
| updatedByUserId | String?            |                      | User who last updated       |
| createdAt       | DateTime           | @default(now())      | Creation timestamp          |
| updatedAt       | DateTime           | @updatedAt           | Last update timestamp       |
| deletedAt       | DateTime?          |                      | Soft delete timestamp       |

**Relations:**

- Many-to-one with User, Gym, Role, Invitation
- One-to-many with Evaluation (as advisor)

### Invitation

Manages invitations for users to join gyms as collaborators.

| Field            | Type             | Attributes           | Description                 |
| ---------------- | ---------------- | -------------------- | --------------------------- |
| id               | String           | @id @default(uuid()) | Unique identifier           |
| gymId            | String           |                      | Target gym                  |
| email            | String           |                      | Invitee email               |
| roleId           | String           |                      | Proposed role               |
| token            | String           | @unique              | Invitation token            |
| status           | InvitationStatus |                      | Invitation status           |
| invitedByUserId  | String           |                      | User who sent invitation    |
| expiresAt        | DateTime         |                      | Expiration timestamp        |
| acceptedByUserId | String?          |                      | User who accepted           |
| acceptedAt       | DateTime?        |                      | Acceptance timestamp        |
| createdByUserId  | String           |                      | User who created invitation |
| updatedByUserId  | String?          |                      | User who last updated       |
| createdAt        | DateTime         | @default(now())      | Creation timestamp          |
| updatedAt        | DateTime         | @updatedAt           | Last update timestamp       |
| deletedAt        | DateTime?        |                      | Soft delete timestamp       |

**Relations:**

- Many-to-one with Gym, Role, User (invitedBy, acceptedBy)
- One-to-many with Collaborator

## Client Management

### GymClient

Represents customers/members of a gym.

| Field                 | Type         | Attributes           | Description                     |
| --------------------- | ------------ | -------------------- | ------------------------------- |
| id                    | String       | @id @default(uuid()) | Unique identifier               |
| gymId                 | String       |                      | Associated gym                  |
| clientNumber          | String       |                      | Gym-specific client number      |
| name                  | String       |                      | Client's full name              |
| birthDate             | DateTime?    |                      | Date of birth                   |
| documentValue         | String?      |                      | ID document number              |
| documentType          | String?      |                      | Type of ID document             |
| phone                 | String?      |                      | Phone number                    |
| email                 | String?      |                      | Email address                   |
| status                | ClientStatus |                      | Client status (active/inactive) |
| profilePhotoId        | String?      |                      | Profile photo asset ID          |
| documentFrontPhotoId  | String?      |                      | ID document front photo         |
| documentBackPhotoId   | String?      |                      | ID document back photo          |
| emergencyContactName  | String?      |                      | Emergency contact name          |
| emergencyContactPhone | String?      |                      | Emergency contact phone         |
| medicalConditions     | String?      |                      | Medical conditions/notes        |
| notes                 | String?      |                      | General notes                   |
| createdByUserId       | String       |                      | User who created the record     |
| updatedByUserId       | String?      |                      | User who last updated           |
| createdAt             | DateTime     | @default(now())      | Creation timestamp              |
| updatedAt             | DateTime     | @updatedAt           | Last update timestamp           |
| deletedAt             | DateTime?    |                      | Soft delete timestamp           |

**Unique Constraints:**

- (gymId, clientNumber)
- (gymId, documentValue)

**Relations:**

- Many-to-one with Gym
- One-to-many with Contract, CheckIn, Evaluation
- One-to-many with Lead (convertedLeads)

### GymMembershipPlan

Defines membership packages offered by a gym.

| Field               | Type       | Attributes           | Description                  |
| ------------------- | ---------- | -------------------- | ---------------------------- |
| id                  | String     | @id @default(uuid()) | Unique identifier            |
| gymId               | String     |                      | Associated gym               |
| name                | String     |                      | Plan name                    |
| basePrice           | Decimal    |                      | Base price                   |
| durationMonths      | Int?       |                      | Duration in months           |
| durationDays        | Int?       |                      | Duration in days             |
| description         | String?    |                      | Plan description             |
| features            | Json?      |                      | Included features            |
| termsAndConditions  | String?    |                      | Terms and conditions         |
| allowsCustomPricing | Boolean    | @default(false)      | Custom pricing allowed       |
| maxEvaluations      | Int        | @default(0)          | Maximum evaluations included |
| includesAdvisor     | Boolean    | @default(false)      | Includes personal advisor    |
| showInCatalog       | Boolean    | @default(false)      | Visible in public catalog    |
| assetsIds           | String[]   | @default([])         | Associated asset IDs         |
| status              | PlanStatus |                      | Plan status                  |
| createdByUserId     | String     |                      | User who created the plan    |
| updatedByUserId     | String?    |                      | User who last updated        |
| createdAt           | DateTime   | @default(now())      | Creation timestamp           |
| updatedAt           | DateTime   | @updatedAt           | Last update timestamp        |
| deletedAt           | DateTime?  |                      | Soft delete timestamp        |

**Relations:**

- Many-to-one with Gym
- One-to-many with Contract

### Contract

Represents a signed membership contract between a client and gym.

| Field               | Type             | Attributes           | Description                 |
| ------------------- | ---------------- | -------------------- | --------------------------- |
| id                  | String           | @id @default(uuid()) | Unique identifier           |
| gymClientId         | String           |                      | Associated client           |
| gymMembershipPlanId | String           |                      | Membership plan             |
| startDate           | DateTime         |                      | Contract start date         |
| endDate             | DateTime         |                      | Contract end date           |
| basePrice           | Decimal          |                      | Plan's base price           |
| customPrice         | Decimal?         |                      | Custom negotiated price     |
| finalAmount         | Decimal          |                      | Final amount to pay         |
| currency            | String           |                      | Payment currency            |
| discountPercentage  | Decimal?         |                      | Discount percentage applied |
| discountAmount      | Decimal?         |                      | Discount amount applied     |
| status              | ContractStatus   |                      | Contract status             |
| paymentFrequency    | PaymentFrequency |                      | Payment schedule            |
| notes               | String?          |                      | Contract notes              |
| termsAndConditions  | String?          |                      | Specific terms              |
| contractDocumentId  | String?          |                      | Signed contract document    |
| paymentReceiptIds   | Json?            |                      | Payment receipt assets      |
| receiptIds          | String[]         | @default([])         | Receipt asset IDs           |
| createdByUserId     | String           |                      | User who created contract   |
| updatedByUserId     | String?          |                      | User who last updated       |
| approvedByUserId    | String?          |                      | User who approved contract  |
| approvedAt          | DateTime?        |                      | Approval timestamp          |
| cancelledByUserId   | String?          |                      | User who cancelled contract |
| cancelledAt         | DateTime?        |                      | Cancellation timestamp      |
| createdAt           | DateTime         | @default(now())      | Creation timestamp          |
| updatedAt           | DateTime         | @updatedAt           | Last update timestamp       |
| deletedAt           | DateTime?        |                      | Soft delete timestamp       |

**Relations:**

- Many-to-one with GymClient, GymMembershipPlan, Gym
- Many-to-one with User (createdBy, updatedBy, approvedBy, cancelledBy)

### CheckIn

Records client visits to the gym.

| Field              | Type      | Attributes           | Description                   |
| ------------------ | --------- | -------------------- | ----------------------------- |
| id                 | String    | @id @default(uuid()) | Unique identifier             |
| gymClientId        | String    |                      | Client who checked in         |
| gymId              | String    |                      | Gym location                  |
| timestamp          | DateTime  | @default(now())      | Check-in time                 |
| registeredByUserId | String    |                      | Staff who registered check-in |
| notes              | String?   |                      | Check-in notes                |
| createdByUserId    | String    |                      | User who created the record   |
| updatedByUserId    | String?   |                      | User who last updated         |
| createdAt          | DateTime  | @default(now())      | Creation timestamp            |
| updatedAt          | DateTime  | @updatedAt           | Last update timestamp         |
| deletedAt          | DateTime? |                      | Soft delete timestamp         |

**Relations:**

- Many-to-one with GymClient, Gym
- Many-to-one with User (registeredBy, createdBy, updatedBy)

### Evaluation

Tracks fitness assessments and progress for clients.

| Field              | Type             | Attributes           | Description                   |
| ------------------ | ---------------- | -------------------- | ----------------------------- |
| id                 | String           | @id @default(uuid()) | Unique identifier             |
| gymClientId        | String           |                      | Client being evaluated        |
| advisorId          | String?          |                      | Assigned advisor/trainer      |
| evaluationType     | EvaluationType   |                      | Type of evaluation            |
| status             | EvaluationStatus |                      | Evaluation status             |
| durationDays       | Int              |                      | Evaluation period             |
| plannedEndDate     | DateTime         |                      | Planned completion date       |
| actualEndDate      | DateTime?        |                      | Actual completion date        |
| initialData        | Json?            |                      | Initial measurements          |
| finalData          | Json?            |                      | Final measurements            |
| progressPercentage | Decimal?         |                      | Progress percentage           |
| goals              | String?          |                      | Evaluation goals              |
| resultsSummary     | String?          |                      | Results summary               |
| initialPhotoIds    | Json?            |                      | Initial photos                |
| progressPhotoIds   | Json?            |                      | Progress photos               |
| finalPhotoIds      | Json?            |                      | Final photos                  |
| documentIds        | Json?            |                      | Related documents             |
| createdByUserId    | String           |                      | User who created evaluation   |
| updatedByUserId    | String?          |                      | User who last updated         |
| completedByUserId  | String?          |                      | User who completed evaluation |
| createdAt          | DateTime         | @default(now())      | Creation timestamp            |
| updatedAt          | DateTime         | @updatedAt           | Last update timestamp         |
| deletedAt          | DateTime?        |                      | Soft delete timestamp         |

**Relations:**

- Many-to-one with GymClient, Collaborator (advisor), Gym
- Many-to-one with User (createdBy, updatedBy, completedBy)
- One-to-many with EvaluationComment

### EvaluationComment

Comments and notes on evaluations for progress tracking.

| Field           | Type        | Attributes           | Description              |
| --------------- | ----------- | -------------------- | ------------------------ |
| id              | String      | @id @default(uuid()) | Unique identifier        |
| evaluationId    | String      |                      | Associated evaluation    |
| commentType     | CommentType |                      | Type of comment          |
| comment         | String      |                      | Comment text             |
| isPrivate       | Boolean     | @default(false)      | Private comment flag     |
| attachmentIds   | Json?       |                      | Attached files           |
| createdByUserId | String      |                      | User who created comment |
| updatedByUserId | String?     |                      | User who last updated    |
| createdAt       | DateTime    | @default(now())      | Creation timestamp       |
| updatedAt       | DateTime    | @updatedAt           | Last update timestamp    |
| deletedAt       | DateTime?   |                      | Soft delete timestamp    |

**Relations:**

- Many-to-one with Evaluation
- Many-to-one with User (createdBy, updatedBy)

## Lead Management

### Lead

Manages potential customers and inquiries.

| Field               | Type       | Attributes           | Description           |
| ------------------- | ---------- | -------------------- | --------------------- |
| id                  | String     | @id @default(uuid()) | Unique identifier     |
| gymId               | String     |                      | Target gym            |
| name                | String     |                      | Lead name             |
| email               | String     |                      | Lead email            |
| phone               | String     |                      | Lead phone            |
| message             | String?    |                      | Initial message       |
| source              | String?    |                      | Lead source           |
| status              | LeadStatus | @default(NEW)        | Lead status           |
| metadata            | Json?      |                      | Additional data       |
| assignedToUserId    | String?    |                      | Assigned staff member |
| notes               | String?    |                      | Follow-up notes       |
| assetId             | String?    |                      | Related asset         |
| assetIds            | String[]   | @default([])         | Related assets        |
| convertedToClientId | String?    |                      | Converted client      |
| convertedAt         | DateTime?  |                      | Conversion timestamp  |
| createdByUserId     | String?    |                      | User who created lead |
| updatedByUserId     | String?    |                      | User who last updated |
| createdAt           | DateTime   | @default(now())      | Creation timestamp    |
| updatedAt           | DateTime   | @updatedAt           | Last update timestamp |
| deletedAt           | DateTime?  |                      | Soft delete timestamp |

**Relations:**

- Many-to-one with Gym, User (assignedTo), GymClient (convertedToClient)
- Many-to-one with User (createdBy, updatedBy)

## Asset Management

### Asset

Manages files and media associated with gyms.

| Field            | Type        | Attributes           | Description             |
| ---------------- | ----------- | -------------------- | ----------------------- |
| id               | String      | @id @default(uuid()) | Unique identifier       |
| filename         | String      |                      | File name               |
| originalName     | String      |                      | Original file name      |
| filePath         | String      |                      | Storage path            |
| fileSize         | Int         |                      | File size in bytes      |
| mimeType         | String      |                      | MIME type               |
| gymId            | String      |                      | Associated gym          |
| uploadedByUserId | String      |                      | User who uploaded       |
| metadata         | Json?       |                      | File metadata           |
| status           | AssetStatus |                      | Asset status            |
| description      | String?     |                      | Asset description       |
| createdByUserId  | String      |                      | User who created record |
| updatedByUserId  | String?     |                      | User who last updated   |
| createdAt        | DateTime    | @default(now())      | Creation timestamp      |
| updatedAt        | DateTime    | @updatedAt           | Last update timestamp   |
| deletedAt        | DateTime?   |                      | Soft delete timestamp   |

**Relations:**

- Many-to-one with Gym
- Many-to-one with User (uploadedBy, createdBy, updatedBy)

### File

Manages user-specific files (not gym-scoped).

| Field        | Type      | Attributes           | Description           |
| ------------ | --------- | -------------------- | --------------------- |
| id           | String    | @id @default(uuid()) | Unique identifier     |
| filename     | String    |                      | File name             |
| originalName | String    |                      | Original file name    |
| filePath     | String    |                      | Storage path          |
| fileSize     | Int       |                      | File size in bytes    |
| mimeType     | String    |                      | MIME type             |
| userId       | String    |                      | File owner            |
| metadata     | Json?     |                      | File metadata         |
| status       | String    | @default("active")   | File status           |
| description  | String?   |                      | File description      |
| createdAt    | DateTime  | @default(now())      | Creation timestamp    |
| updatedAt    | DateTime  | @updatedAt           | Last update timestamp |
| deletedAt    | DateTime? |                      | Soft delete timestamp |

**Relations:**

- Many-to-one with User

## Inventory & Sales

### ProductCategory

Organizes products into categories for better management.

| Field           | Type      | Attributes           | Description               |
| --------------- | --------- | -------------------- | ------------------------- |
| id              | String    | @id @default(uuid()) | Unique identifier         |
| gymId           | String    |                      | Associated gym            |
| name            | String    |                      | Category name             |
| description     | String?   |                      | Category description      |
| color           | String?   |                      | Category color code       |
| createdByUserId | String    |                      | User who created category |
| updatedByUserId | String?   |                      | User who last updated     |
| createdAt       | DateTime  | @default(now())      | Creation timestamp        |
| updatedAt       | DateTime  | @updatedAt           | Last update timestamp     |
| deletedAt       | DateTime? |                      | Soft delete timestamp     |

**Relations:**

- Many-to-one with Gym
- Many-to-one with User (createdBy, updatedBy)
- One-to-many with Product

### Product

Represents items available for sale at the gym.

| Field           | Type          | Attributes           | Description              |
| --------------- | ------------- | -------------------- | ------------------------ |
| id              | String        | @id @default(uuid()) | Unique identifier        |
| gymId           | String        |                      | Associated gym           |
| categoryId      | String?       |                      | Product category         |
| name            | String        |                      | Product name             |
| description     | String?       |                      | Product description      |
| price           | Decimal       |                      | Product price            |
| stock           | Int           | @default(0)          | Stock quantity           |
| imageId         | String?       |                      | Product image asset      |
| status          | ProductStatus | @default(active)     | Product status           |
| createdByUserId | String        |                      | User who created product |
| updatedByUserId | String?       |                      | User who last updated    |
| createdAt       | DateTime      | @default(now())      | Creation timestamp       |
| updatedAt       | DateTime      | @updatedAt           | Last update timestamp    |
| deletedAt       | DateTime?     |                      | Soft delete timestamp    |

**Relations:**

- Many-to-one with Gym, ProductCategory
- Many-to-one with User (createdBy, updatedBy)
- One-to-many with SaleItem

### Supplier

Manages supplier information for inventory management.

| Field           | Type      | Attributes           | Description               |
| --------------- | --------- | -------------------- | ------------------------- |
| id              | String    | @id @default(uuid()) | Unique identifier         |
| gymId           | String    |                      | Associated gym            |
| name            | String    |                      | Supplier name             |
| contactInfo     | String?   |                      | Contact information       |
| phone           | String?   |                      | Phone number              |
| email           | String?   |                      | Email address             |
| address         | String?   |                      | Physical address          |
| createdByUserId | String    |                      | User who created supplier |
| updatedByUserId | String?   |                      | User who last updated     |
| createdAt       | DateTime  | @default(now())      | Creation timestamp        |
| updatedAt       | DateTime  | @updatedAt           | Last update timestamp     |
| deletedAt       | DateTime? |                      | Soft delete timestamp     |

**Relations:**

- Many-to-one with Gym
- Many-to-one with User (createdBy, updatedBy)

### Sale

Records sales transactions at the gym.

| Field           | Type          | Attributes           | Description           |
| --------------- | ------------- | -------------------- | --------------------- |
| id              | String        | @id @default(uuid()) | Unique identifier     |
| gymId           | String        |                      | Associated gym        |
| saleNumber      | String        |                      | Sale number           |
| total           | Decimal       |                      | Total sale amount     |
| paymentStatus   | PaymentStatus | @default(unpaid)     | Payment status        |
| saleDate        | DateTime      | @default(now())      | Sale date             |
| customerName    | String?       |                      | Customer name         |
| notes           | String?       |                      | Sale notes            |
| createdByUserId | String        |                      | User who created sale |
| updatedByUserId | String?       |                      | User who last updated |
| createdAt       | DateTime      | @default(now())      | Creation timestamp    |
| updatedAt       | DateTime      | @updatedAt           | Last update timestamp |
| deletedAt       | DateTime?     |                      | Soft delete timestamp |

**Unique Constraints:**

- (gymId, saleNumber)

**Relations:**

- Many-to-one with Gym
- Many-to-one with User (createdBy, updatedBy)
- One-to-many with SaleItem

### SaleItem

Individual items within a sale transaction.

| Field           | Type      | Attributes           | Description           |
| --------------- | --------- | -------------------- | --------------------- |
| id              | String    | @id @default(uuid()) | Unique identifier     |
| saleId          | String    |                      | Associated sale       |
| productId       | String    |                      | Product sold          |
| quantity        | Int       |                      | Quantity sold         |
| unitPrice       | Decimal   |                      | Unit price            |
| total           | Decimal   |                      | Line total            |
| createdByUserId | String    |                      | User who created item |
| updatedByUserId | String?   |                      | User who last updated |
| createdAt       | DateTime  | @default(now())      | Creation timestamp    |
| updatedAt       | DateTime  | @updatedAt           | Last update timestamp |
| deletedAt       | DateTime? |                      | Soft delete timestamp |

**Relations:**

- Many-to-one with Sale, Product
- Many-to-one with User (createdBy, updatedBy)

## System Enums

### UserType

- `owner` - Organization owner
- `collaborator` - Staff member

### SubscriptionStatus

- `active` - Active subscription
- `inactive` - Inactive subscription
- `expired` - Expired subscription

### CollaboratorStatus

- `pending` - Pending activation
- `active` - Active employee
- `inactive` - Inactive employee

### InvitationStatus

- `pending` - Invitation sent, awaiting response
- `accepted` - Invitation accepted
- `expired` - Invitation expired

### ClientStatus

- `active` - Active client
- `inactive` - Inactive client

### PlanStatus

- `active` - Available plan
- `inactive` - Unavailable plan
- `archived` - Archived plan

### ContractStatus

- `pending` - Awaiting approval
- `active` - Active contract
- `expiring_soon` - Expiring soon
- `expired` - Expired contract
- `cancelled` - Cancelled contract

### PaymentFrequency

- `monthly` - Monthly payments
- `quarterly` - Quarterly payments
- `annual` - Annual payments

### AssetStatus

- `active` - Available asset
- `deleted` - Deleted asset

### EvaluationType

- `initial` - Initial evaluation
- `progress` - Progress evaluation
- `final` - Final evaluation

### EvaluationStatus

- `open` - Open for data entry
- `in_progress` - In progress
- `completed` - Completed
- `cancelled` - Cancelled

### CommentType

- `progress_note` - Progress note
- `phone_call` - Phone call record
- `meeting` - Meeting record
- `reminder` - Reminder note
- `other` - Other type

### LeadStatus

- `NEW` - New lead
- `CONTACTED` - Contacted
- `INTERESTED` - Interested
- `CONVERTED` - Converted to client
- `LOST` - Lost lead

### ProductStatus

- `active` - Available product
- `inactive` - Unavailable product

### PaymentStatus

- `paid` - Paid
- `unpaid` - Unpaid

### DurationPeriod

- `DAY` - Day period
- `MONTH` - Month period

---

_This documentation is automatically generated from the Prisma schema. For implementation details, see the API documentation._
