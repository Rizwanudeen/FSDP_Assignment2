# Collaboration Access Request Feature

## Overview
This feature enables users to discover public resources (agents, conversations, tasks, teams) and request access to them. Resource owners can approve or deny requests through a dedicated interface.

## Features Implemented

### 1. Resource Visibility Control
- All resources (Agents, Conversations, Tasks, Teams) now have a `visibility` field
- Options: `public` (discoverable) or `private` (default)
- Owners can toggle visibility at any time

### 2. Public Resource Search
- Users can search for public resources by name, title, or description
- Search page displays all resource types with owner information
- One-click access request from search results

### 3. Access Request System
- Users can request access to any public resource
- System prevents duplicate requests
- Request status: `pending`, `approved`, or `denied`

### 4. Request Management
- Owners have a dedicated "Requests" page
- View all pending access requests
- Approve or deny requests with one click
- Real-time updates (auto-refresh every 30 seconds)

### 5. Shared Resources
- Dashboard displays "Shared with Me" section
- Shows all resources where user has been granted access
- Easy navigation to shared resources
- Role-based access (viewer/collaborator)

### 6. Authorization
- Owners: Full control over their resources
- Approved users: Can view/use resources (cannot delete or change ownership)
- Non-approved users: Cannot access private resources

## Database Schema

### New Tables

#### ShareRequests
```sql
CREATE TABLE ShareRequests (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  resourceType NVARCHAR(50) NOT NULL,
  resourceId UNIQUEIDENTIFIER NOT NULL,
  requesterUserId UNIQUEIDENTIFIER NOT NULL,
  ownerUserId UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(20) DEFAULT 'pending',
  createdAt DATETIME2,
  updatedAt DATETIME2
);
```

#### ResourceAccess
```sql
CREATE TABLE ResourceAccess (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  resourceType NVARCHAR(50) NOT NULL,
  resourceId UNIQUEIDENTIFIER NOT NULL,
  userId UNIQUEIDENTIFIER NOT NULL,
  role NVARCHAR(50) DEFAULT 'collaborator',
  createdAt DATETIME2,
  UNIQUE(resourceType, resourceId, userId)
);
```

### Schema Changes
Added `visibility` column (NVARCHAR(20), default 'private') to:
- Agents
- Conversations
- CollaborativeTasks
- Teams

## API Endpoints

### Search & Discovery
- `GET /api/search/public?query=<term>` - Search public resources

### Share Requests
- `POST /api/share-requests` - Create access request
  - Body: `{ resourceType, resourceId }`
- `GET /api/share-requests/pending` - Get pending requests (for owners)
- `POST /api/share-requests/:id/approve` - Approve request
- `POST /api/share-requests/:id/deny` - Deny request

### Visibility Management
- `PATCH /api/resources/:type/:id/visibility` - Toggle visibility
  - Body: `{ visibility: "public" | "private" }`

### Shared Resources
- `GET /api/shared-resources` - Get all shared resources for logged-in user

## Frontend Pages

### 1. Search Page (`/search`)
- Search bar with real-time filtering
- Results grouped by resource type
- "Request Access" button for each resource
- Shows owner information

### 2. Requests Page (`/requests`)
- List of pending access requests
- Approve/Deny actions
- Auto-refresh every 30 seconds
- Shows requester details

### 3. Dashboard Updates
- Added navigation buttons for Search and Requests
- "Shared with Me" section showing granted access
- Click to navigate to shared resources

## Components

### VisibilityToggle
Reusable component for toggling resource visibility:
```tsx
<VisibilityToggle
  resourceType="agent"
  resourceId="uuid"
  currentVisibility="private"
  onUpdate={(newVisibility) => console.log(newVisibility)}
/>
```

## Setup Instructions

### 1. Run Database Migration
```bash
# Navigate to backend schemas folder
cd backend/schemas

# Run the migration script in SQL Server Management Studio or via command line
sqlcmd -S Rizwan\SQLEXPRESS -d FSDP -i add-collaboration-features.sql
```

Or run the main schema file which includes all changes:
```bash
sqlcmd -S Rizwan\SQLEXPRESS -i create-app-tables-FSDP.sql
```

### 2. Restart Backend Server
```bash
cd backend
npm run dev
```

### 3. Restart Frontend
```bash
cd frontend
npm run dev
```

## Usage Flow

### For Resource Owners:
1. Create a resource (agent, conversation, task, or team)
2. Toggle visibility to "public" using the VisibilityToggle component
3. Wait for access requests
4. Navigate to `/requests` to view pending requests
5. Approve or deny requests

### For Users Seeking Access:
1. Navigate to `/search`
2. Enter search terms to find public resources
3. Click "Request Access" on desired resource
4. Wait for owner approval
5. Access granted resources from Dashboard "Shared with Me" section

## Security Notes

- All endpoints require authentication
- Authorization checks ensure:
  - Only owners can toggle visibility
  - Only owners can approve/deny requests
  - Only approved users can access shared resources
- SQL injection prevention via parameterized queries
- Unique constraint prevents duplicate access grants

## Future Enhancements (Not Implemented)

- Revoke access functionality
- Access expiration dates
- Different permission levels (read-only vs edit)
- Notification system for request updates
- Activity logs for access requests
- Batch approve/deny requests

## Files Changed/Added

### Backend
- `backend/src/services/shareService.ts` (NEW)
- `backend/src/controllers/shareController.ts` (NEW)
- `backend/src/routes/shareRoutes.ts` (NEW)
- `backend/src/app.ts` (MODIFIED)
- `backend/schemas/create-app-tables-FSDP.sql` (MODIFIED)
- `backend/schemas/add-collaboration-features.sql` (NEW)

### Frontend
- `frontend/src/services/shareService.ts` (NEW)
- `frontend/src/pages/SearchPage.tsx` (NEW)
- `frontend/src/pages/RequestsPage.tsx` (NEW)
- `frontend/src/components/VisibilityToggle.tsx` (NEW)
- `frontend/src/pages/Dashboard.tsx` (MODIFIED)
- `frontend/src/App.tsx` (MODIFIED)

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create a test agent and toggle to public
- [ ] Search for public agent from another user account
- [ ] Request access to public agent
- [ ] Verify request appears in owner's Requests page
- [ ] Approve request
- [ ] Verify resource appears in "Shared with Me"
- [ ] Test deny request flow
- [ ] Toggle resource to private (shared users keep access)
- [ ] Test all resource types (agent, conversation, task, team)

## Support

For issues or questions, please check:
1. Database migration ran successfully
2. Backend server restarted after code changes
3. Frontend rebuilt after new pages added
4. Browser console for any errors
5. Backend logs for detailed error messages
