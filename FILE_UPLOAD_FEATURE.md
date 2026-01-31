# 📎 File Upload Feature

## Overview
Added document and image upload functionality to both **Conversations** and **Team Collaborative Tasks**.

## Features
- ✅ Upload multiple files (up to 5 per message/task)
- ✅ Support for images (JPG, PNG, GIF, WebP)
- ✅ Support for documents (PDF, Word, Excel, PowerPoint)
- ✅ Support for text files (TXT, CSV)
- ✅ File size limit: 10MB per file
- ✅ Visual file previews with thumbnails
- ✅ Easy file removal before sending
- ✅ Secure file storage with unique identifiers

## Setup Instructions

### 1. Database Migration
Run the migration script to create the necessary tables:

```powershell
cd backend
.\migrate-file-attachments.ps1
```

This creates two new tables:
- **MessageAttachments** - Stores files attached to conversation messages
- **TaskAttachments** - Stores files attached to team tasks

### 2. Install Dependencies
Dependencies are already installed:
- `multer` - File upload middleware
- `uuid` - Unique filename generation
- `@types/multer` - TypeScript types

### 3. Restart Backend
The backend has been updated with:
- Upload service (`backend/src/services/uploadService.ts`)
- Upload middleware (`backend/src/middleware/upload.ts`)
- Upload routes (`backend/src/routes/uploadRoutes.ts`)
- Main app integration

Restart your backend server:
```powershell
cd backend
npm run dev
```

### 4. Frontend Updates
The frontend has been updated with:
- `FileUpload` component (`frontend/src/components/FileUpload.tsx`)
- Updated `ChatInterface` with file upload support
- Updated `TeamDetails` with file upload for tasks

Frontend should hot-reload automatically.

## Usage

### In Conversations
1. Click "Attach files" button above the message input
2. Select one or more files (images, PDFs, documents)
3. Preview selected files with thumbnails
4. Remove files by clicking the X button on preview
5. Type your message and click Send

### In Team Tasks
1. Create a new collaborative task
2. In the task creation modal, scroll to "Attachments (Optional)"
3. Click "Attach files" and select files
4. Files will be uploaded when the task is created

## File Storage
- Files are stored in the `backend/uploads/` directory:
  - `uploads/conversations/` - Conversation attachments
  - `uploads/tasks/` - Task attachments
- Each file gets a unique UUID filename to prevent conflicts
- Original filenames are preserved in the database

## API Endpoints

### Upload Endpoints
- `POST /api/uploads/messages/:messageId` - Upload file for message
- `POST /api/uploads/tasks/:taskId` - Upload file for task

### Retrieval Endpoints
- `GET /api/uploads/messages/:messageId` - Get message attachments
- `GET /api/uploads/tasks/:taskId` - Get task attachments
- `GET /api/uploads/files/:type/:fileName` - Download/view file

### Delete Endpoint
- `DELETE /api/uploads/:type/:attachmentId` - Delete attachment

## Database Schema

### MessageAttachments
```sql
CREATE TABLE MessageAttachments (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  messageId UNIQUEIDENTIFIER NOT NULL,
  fileName NVARCHAR(500),
  originalFileName NVARCHAR(500),
  filePath NVARCHAR(1000),
  fileType NVARCHAR(100),
  fileSize BIGINT,
  uploadedAt DATETIME2
)
```

### TaskAttachments
```sql
CREATE TABLE TaskAttachments (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  taskId UNIQUEIDENTIFIER NOT NULL,
  fileName NVARCHAR(500),
  originalFileName NVARCHAR(500),
  filePath NVARCHAR(1000),
  fileType NVARCHAR(100),
  fileSize BIGINT,
  uploadedBy UNIQUEIDENTIFIER NOT NULL,
  uploadedAt DATETIME2
)
```

## Security Features
- ✅ Authentication required for all upload endpoints
- ✅ File type validation (whitelist of allowed MIME types)
- ✅ File size validation (10MB limit)
- ✅ Unique filename generation prevents overwrites
- ✅ Separate storage directories for conversations vs tasks

## Troubleshooting

### Files not uploading
1. Check backend console for errors
2. Verify `uploads/` directories exist
3. Check file size (must be < 10MB)
4. Verify file type is allowed

### Database errors
1. Run migration script: `.\migrate-file-attachments.ps1`
2. Check SQL Server connection
3. Verify tables were created: Check FSDP database for `MessageAttachments` and `TaskAttachments`

### Frontend not showing upload button
1. Clear browser cache
2. Check console for errors
3. Verify `FileUpload` component imported correctly
