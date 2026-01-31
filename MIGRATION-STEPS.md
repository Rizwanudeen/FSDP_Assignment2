# MSSQL to Supabase Migration Guide

## Prerequisites
- Supabase account (https://supabase.com)
- MSSQL database backup
- Node.js & npm installed

## Step 1: Setup Supabase Project

1. Go to https://supabase.com and sign up
2. Create a new project
3. Wait for database provisioning (~2 minutes)
4. Go to Project Settings > API
5. Copy these credentials:
   - Project URL
   - `anon` public key
   - `service_role` secret key
6. Go to Project Settings > Database and copy the password

## Step 2: Run SQL Migration

1. Open Supabase SQL Editor (in your project dashboard)
2. Copy and paste the entire content from `backend/schemas/supabase-migration.sql`
3. Click "Run" to create all tables
4. Verify tables were created in "Table Editor"

## Step 3: Export & Import Data

### Export from MSSQL:
```bash
# Option 1: Use SQL Server Management Studio
# Right-click database > Tasks > Generate Scripts
# Choose your tables and export as INSERT statements

# Option 2: Use the provided export script
# Run backend/schemas/export-mssql-data.sql in SSMS
# Save output to a file
```

### Import to Supabase:
```bash
# In Supabase SQL Editor, paste the INSERT statements
# Or use the Supabase CLI:
supabase db push --local
```

## Step 4: Install Dependencies

```bash
cd backend
npm install @supabase/supabase-js
```

## Step 5: Update Environment Variables

Create `backend/.env` with:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-from-supabase-settings
OPENAI_API_KEY=your-openai-key
PORT=3000
```

## Step 6: Update Database Import

Replace in your service files:
```typescript
// OLD:
import { db } from '../config/database';

// NEW:
import { db } from '../config/supabase';
```

Or create an alias in `backend/src/config/database.ts`:
```typescript
export { db } from './supabase';
```

## Step 7: Update SQL Queries

### Key Syntax Differences:

| MSSQL | PostgreSQL |
|-------|------------|
| `NEWID()` | `uuid_generate_v4()` |
| `SYSUTCDATETIME()` | `NOW()` |
| `TOP 10` | `LIMIT 10` |
| `NVARCHAR(MAX)` | `TEXT` |
| `BIT` | `BOOLEAN` |
| `DATETIME2` | `TIMESTAMPTZ` |
| `@param` | `$1, $2, ...` |

### Example Query Conversion:

**MSSQL:**
```sql
SELECT TOP 10 * FROM Agents 
WHERE userId = @userId AND isDeleted = 0
ORDER BY createdAt DESC
```

**PostgreSQL:**
```sql
SELECT * FROM agents 
WHERE user_id = $1 AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10
```

## Step 8: Test Migration

```bash
# Start backend
cd backend
npm run dev

# Test endpoints
curl http://localhost:3000/api/agents
```

## Step 9: Update Frontend (if needed)

Frontend should work without changes if using the same API endpoints.

For direct Supabase client access in frontend:
```bash
cd frontend
npm install @supabase/supabase-js
```

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

## Step 10: Enable Row Level Security (RLS)

In Supabase SQL Editor:
```sql
-- Already included in migration script
-- Customize policies as needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- etc...
```

## Step 11: Setup Authentication (Optional)

Replace custom JWT with Supabase Auth:
```typescript
// Use Supabase built-in auth
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

## Rollback Plan

Keep MSSQL running until fully tested:
1. Maintain dual database configuration
2. Test thoroughly in development
3. Run parallel systems for 1-2 weeks
4. Monitor for issues
5. Decommission MSSQL after validation

## Benefits of Supabase

✅ No server maintenance
✅ Automatic backups
✅ Built-in authentication
✅ Real-time subscriptions
✅ Auto-generated REST API
✅ Free tier (500MB database, 2GB bandwidth)
✅ Better PostgreSQL features (JSONB, arrays, etc.)
✅ Row Level Security built-in

## Troubleshooting

### Connection Issues:
- Check Supabase project is active
- Verify API keys in .env
- Check firewall/network settings

### Query Errors:
- Use Supabase SQL Editor to test queries
- Check column names (snake_case vs camelCase)
- Verify parameter syntax ($1 not @param)

### Authentication Errors:
- Ensure JWT_SECRET matches Supabase settings
- Check RLS policies if data not returning

## Next Steps

1. Setup Supabase Edge Functions (optional)
2. Configure Storage buckets for file uploads
3. Enable real-time subscriptions
4. Setup database backups
5. Configure production environment
