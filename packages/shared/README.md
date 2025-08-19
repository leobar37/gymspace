# @gymspace/shared

Shared types, interfaces, and constants for the GymSpace ecosystem.

## Installation

```bash
npm install @gymspace/shared
# or
yarn add @gymspace/shared
# or
pnpm add @gymspace/shared
```

## Usage

```typescript
import { 
  IUser, 
  IGym, 
  Permission, 
  UserType,
  ContractStatus,
  PERMISSIONS 
} from '@gymspace/shared';

// Use the types in your application
const user: IUser = {
  id: '123',
  email: 'user@example.com',
  type: UserType.Client,
  // ...
};
```

## What's included

- **Types & Interfaces**: Core domain models (User, Gym, Organization, etc.)
- **Enums**: Status types, user types, and other enumerations
- **Constants**: Permission definitions, cache TTLs, and other constants
- **Utilities**: Common type utilities and helpers

## License

MIT © GymSpace Team
