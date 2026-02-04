# Zunou Services - AI Coding Agent Instructions

## Architecture Overview

Monorepo with **GraphQL API** (`services/api` - Laravel + Lighthouse) serving multiple **React frontends** (`services/pulse`, `services/dashboard`, `services/admin`) via shared libraries (`lib/`).

**Service Communication Flow:**
```
React Frontends → lib/zunou-queries → GraphQL API (Lighthouse) → PostgreSQL/Pinecone
```

---

## Creating New Features - Step by Step

### Backend (API) - New Entity Flow

1. **Create Migration** → `services/api/database/migrations/`
   - All IDs are UUIDs: `$table->uuid('id')->primary()`
   - Foreign keys: `$table->uuid('organization_id')->index()`

2. **Create Model** → `services/api/app/Models/YourModel.php`
   ```php
   namespace App\Models;
   
   class YourModel extends BaseModel  // NOT Model - extends BaseModel for UUID
   {
       protected $casts = [
           'status' => YourStatus::class,  // Use enums
           'due_date' => 'datetime',
       ];
       
       // Relationships
       public function organization(): BelongsTo {
           return $this->belongsTo(Organization::class);
       }
       
       // Scopes for GraphQL @builder directive
       public function scopeFilterByStatus($query, $status) {
           return $query->when($status, fn($q) => $q->where('status', $status));
       }
   }
   ```

3. **Create Enum** (if needed) → `services/api/app/Enums/YourStatus.php`
   ```php
   namespace App\Enums;
   
   enum YourStatus: string {
       case ACTIVE = 'ACTIVE';
       case INACTIVE = 'INACTIVE';
   }
   ```

4. **Create DTO** → `services/api/app/DataTransferObjects/YourData.php`
   ```php
   namespace App\DataTransferObjects;
   
   use App\Support\Data;
   
   final class YourData extends Data {
       public function __construct(
           public readonly string $title,
           public readonly string $organization_id,
           public readonly ?string $status = null,
       ) {}
   }
   ```

5. **Create Action** → `services/api/app/Actions/YourEntity/CreateYourEntityAction.php`
   ```php
   namespace App\Actions\YourEntity;
   
   final class CreateYourEntityAction {
       public function handle(YourData $data): YourModel {
           return DB::transaction(fn() => YourModel::create([...]));
       }
   }
   ```

6. **Create GraphQL Schema** → `services/api/graphql/your-entity.graphql`
   ```graphql
   type YourEntity {
       id: ID!
       title: String!
       status: YourStatus
       organization: Organization! @belongsTo
       createdAt: DateTime!
   }
   
   enum YourStatus @enum(class: "App\\Enums\\YourStatus") {
       ACTIVE
       INACTIVE
   }
   
   input CreateYourEntityInput @validator {
       title: String! @rules(apply: ["required", "string", "max:255"])
       organization_id: ID! @rules(apply: ["required", "exists:organizations,id"])
   }
   
   extend type Query @guard {
       yourEntities(
           organizationId: ID! @where(key: "organization_id", operator: "=")
       ): [YourEntity!]! @paginate(defaultCount: 10)
   }
   
   extend type Mutation @guard {
       createYourEntity(input: CreateYourEntityInput!): YourEntity!
           @field(resolver: "App\\GraphQL\\Mutations\\CreateYourEntityMutation")
   }
   ```

7. **Import in schema.graphql** → Add `#import your-entity.graphql`

8. **Create Mutation** → `services/api/app/GraphQL/Mutations/CreateYourEntityMutation.php`
   ```php
   namespace App\GraphQL\Mutations;
   
   readonly class CreateYourEntityMutation {
       public function __construct(
           private readonly CreateYourEntityAction $action
       ) {}
       
       public function __invoke($_, array $args): YourModel {
           return $this->action->handle(YourData::from($args['input']));
       }
   }
   ```

9. **Create Policy** → `services/api/app/Policies/YourEntityPolicy.php`
   ```php
   namespace App\Policies;
   
   class YourEntityPolicy extends AbstractPolicy {
       public function viewAny(User $user, array $args): bool {
           return $user->hasPermission('read:your-entities') 
               && $user->hasOrganization($args['organizationId']);
       }
       
       public function view(User $user, array $args, ?YourEntity $entity = null): bool {
           $entity = $this->loadModel($user, $args, YourEntity::class, $entity);
           return $user->hasPermission('read:your-entities') 
               && $user->hasOrganization($entity->organization_id);
       }
       
       public function create(User $user, array $args): bool {
           return $user->hasPermission('create:your-entities') 
               && $user->hasOrganization($args['input']['organization_id']);
       }
   }
   ```

### Frontend - Consuming New Entity

1. **Regenerate types:** `cd lib/zunou-graphql && make build`

2. **Add Fragment** → `lib/zunou-queries/core/fragments.ts`
   ```typescript
   graphql(/* GraphQL */ `
     fragment YourEntityFragment on YourEntity {
       id
       title
       status
       createdAt
     }
   `)
   ```

3. **Add Query Hook** → `lib/zunou-queries/core/hooks/useGetYourEntitiesQuery.ts`
   ```typescript
   import { useQuery } from '@tanstack/react-query'
   import { graphql } from '@zunou-graphql/core/gql'
   import { gqlClient } from '@zunou-queries/helpers/gqlClient'
   import { useAuthContext } from '@zunou-react/contexts/AuthContext'
   
   const queryDocument = graphql(/* GraphQL */ `
     query GetYourEntities($organizationId: String!) {
       yourEntities(organizationId: $organizationId) {
         ...YourEntityFragment
       }
     }
   `)
   
   export const useGetYourEntitiesQuery = ({ coreUrl, variables, ...options }) => {
     const { isAuthenticated, getToken } = useAuthContext()
     
     return useQuery({
       ...options,
       enabled: isAuthenticated,
       queryKey: ['your-entities', variables.organizationId],
       queryFn: async () => {
         const token = await getToken()
         return gqlClient(coreUrl, token).request(queryDocument, variables)
       },
     })
   }
   ```

4. **Add Mutation Hook** → `lib/zunou-queries/core/hooks/useCreateYourEntityMutation.ts`
   ```typescript
   import { useMutation, useQueryClient } from '@tanstack/react-query'
   
   export const useCreateYourEntityMutation = ({ coreUrl }) => {
     const { getToken } = useAuthContext()
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: async (input) => {
         const token = await getToken()
         return gqlClient(coreUrl, token).request(mutationDocument, { input })
       },
       onSuccess: () => queryClient.invalidateQueries({ queryKey: ['your-entities'] }),
     })
   }
   ```

5. **Use Zustand for local state** (if needed) → `services/dashboard/src/store/useYourEntityStore.ts`
   ```typescript
   import { create } from 'zustand'
   
   interface YourEntityState {
     filters: YourEntityFilters
     setFilters: (filters: YourEntityFilters) => void
   }
   
   export const useYourEntityStore = create<YourEntityState>((set) => ({
     filters: { status: null },
     setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
   }))
   ```

---

## Critical Conventions

### Database & Models
- **All primary keys are UUIDs** (36 chars) - extends `BaseModel` NOT `Model`
- `BaseModel` auto-generates UUID in `creating` boot via `Str::uuid()`
- Use `#[ObservedBy(ModelObserver::class)]` for observers
- Scopes: prefix with `scope` (e.g., `scopeFilterByStatus`)
- Datetime attributes: use `->userTimezone()` for user-local time

### Observers vs Boot Events
- **Observers** (`app/Observers/`): Use for activity logging, side effects after commit
  - Implement `ShouldHandleEventsAfterCommit` for post-transaction logic
  - Register via `#[ObservedBy(TaskObserver::class)]` attribute on model
- **Boot events** (in model): Use for Pinecone sync, embedding jobs
  ```php
  static::created(fn($model) => UpsertEmbeddingsJob::dispatch(...));
  static::updated(fn($model) => UpsertEmbeddingsJob::dispatch(...));
  static::deleting(fn($model) => DeleteEmbeddingsJob::dispatch(...));
  ```

### Authorization (Policies)
- All policies extend `AbstractPolicy` which provides:
  - `loadModel()` - dynamically loads model from args
  - `hasOrganization()` - checks org membership
  - `checkPulseMembership()` - verifies pulse access
- Policy methods: `viewAny`, `view`, `create`, `update`, `delete`
- GraphQL uses `@canModel(ability: "viewAny", injectArgs: true, model: "...")`

### GraphQL Schema (Lighthouse)
- Schema files: `services/api/graphql/*.graphql` (one per domain)
- Main entry: `schema.graphql` imports via `#import`

**Common directives:**
```graphql
@guard                           # Require auth
@canModel(ability: "viewAny", injectArgs: true, model: "App\\Models\\Task")
@rules(apply: ["required", "exists:organizations,id"])
@where(key: "organization_id", operator: "=")
@field(resolver: "App\\GraphQL\\Queries\\TasksQuery")
@builder(method: "App\\Models\\Task@scopeFilterByStatus")
@paginate(defaultCount: 10)
@enum(class: "App\\Enums\\TaskStatus")
@validator                        # Use validator class
@belongsTo / @hasMany / @hasOne  # Eloquent relationships
```

**⚠️ CRITICAL Gotcha:** `@where` and `@builder` on same field CONFLICT. The `@where` processes first, then `@builder` may override or conflict. **Choose ONE approach per filter field.**

### GraphQL Mutations & Queries Pattern
- Location: `services/api/app/GraphQL/Mutations/` and `Queries/`
- **Always** use `readonly class`
- **Always** inject Action classes via constructor
- DTOs in `app/DataTransferObjects/`
- Validators in `app/GraphQL/Validators/`

### Frontend Libraries (lib/)
| Library | Purpose | Rebuild |
|---------|---------|---------|
| `zunou-graphql` | Generated TS types | `make build` after schema changes |
| `zunou-queries` | Queries/mutations with fragments | Manual |
| `zunou-react` | Shared React components | `make build` |

### Frontend State Management
- **Server state:** TanStack Query (React Query) via hooks in `lib/zunou-queries/core/hooks/`
- **Client state:** Zustand stores in `services/{app}/src/store/`
- **Form state:** React Hook Form + Zod schemas in `services/{app}/src/schemas/`
- **Query invalidation:** Always invalidate related queries in mutation `onSuccess`

### Frontend Services
- **Stack:** React + Vite + MUI + TanStack Query + Zod + Zustand
- **Imports:** `@zunou-graphql`, `@zunou-queries`, `@zunou-react`, `~` (src)
- **Auth:** Auth0 via `AuthContext` from zunou-react
- **Access control:** `useAccessControl` hook checks user permissions

---

## Development Commands

```bash
# Root
yarn install && make format && make lint

# API (services/api/)
make dev              # Local server
php artisan tinker    # Interactive shell
php artisan migrate   # Migrations

# Frontends (services/pulse/, dashboard/, admin/)
make dev              # Vite dev server

# After GraphQL schema changes
cd lib/zunou-graphql && make build
```

## Commit Convention

```
fix(api): [#122] resolve status filtering in LiveInsightOutbox
feat(pulse): [#123] add real-time notifications
```
Scopes: `api`, `pulse`, `dashboard`, `admin`, `slack`, `global`

---

## Key File Paths Reference

| To Create/Modify | Location |
|------------------|----------|
| New Model | `services/api/app/Models/` |
| New Enum | `services/api/app/Enums/` |
| New DTO | `services/api/app/DataTransferObjects/` |
| New Action | `services/api/app/Actions/{Domain}/` |
| New GraphQL Schema | `services/api/graphql/{domain}.graphql` |
| New Mutation | `services/api/app/GraphQL/Mutations/` |
| New Query | `services/api/app/GraphQL/Queries/` |
| New Validator | `services/api/app/GraphQL/Validators/` |
| New Policy | `services/api/app/Policies/` |
| New Observer | `services/api/app/Observers/` |
| GraphQL Fragments | `lib/zunou-queries/core/fragments.ts` |
| Query/Mutation Hooks | `lib/zunou-queries/core/hooks/` |
| Zustand Stores | `services/{app}/src/store/` |
| React Components | `lib/zunou-react/components/` |
| Tests | `services/api/tests/Feature/` |

## Testing
```bash
cd services/api && php artisan test
```
Pattern: Feature tests use `RefreshDatabase` trait with Pest PHP
