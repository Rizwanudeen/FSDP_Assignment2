# 🚀 Knowledge Base - Quick Start (5 Minutes)

## Installation

### Step 1: Install Backend Packages (30 seconds)
```bash
cd backend
npm install pdf-parse mammoth
```

### Step 2: Run Database Migration (1 minute)
Open MSSQL Management Studio or your SQL client:
```
File → Open → C:\Users\guang\OneDrive\Desktop\FULLSTACK\fullstack_rsaf\backend\schemas\knowledge-base.sql
Execute (F5)
```
Or from PowerShell:
```bash
cd backend/schemas
# Copy and paste the entire knowledge-base.sql content into MSSQL Management Studio
```

### Step 3: Check .env (30 seconds)
Verify your `backend/.env` has:
```
OPENAI_API_KEY=sk-xxx...     # Required for embeddings
MSSQL_HOST=localhost
MSSQL_USER=your_user
MSSQL_PASSWORD=your_password
MSSQL_DATABASE=FSDP
```

### Step 4: Build & Run (2 minutes)
```bash
cd backend
npm run build
npm run dev  # In dev terminal

cd frontend (in another terminal)
npm run dev  # Your app already has it
```

## ✅ You're Done!

Go to http://localhost:5173 → Click "Knowledge Base" button → Start using!

---

## What You Can Do Now

### Create Knowledge Base
- Click "New Knowledge Base"
- Enter name (e.g., "Company Policies")
- Click Create

### Upload Documents
- Click "Manage" on your KB
- Drag and drop a PDF, DOCX, or TXT file
- Wait 2-5 seconds for processing

### Search
- Click "Search" tab
- Type a question
- See top 5 most relevant document chunks
- Results ranked by relevance (0-100%)

---

## 📁 What Was Added

**Backend:**
- `src/services/knowledgeBaseService.ts` - Core logic
- `src/services/documentProcessingService.ts` - PDF/DOCX parsing
- `src/services/embeddingService.ts` - Vector embeddings
- `src/controllers/knowledgeBaseController.ts` - HTTP handlers
- `src/routes/knowledgeBaseRoutes.ts` - API endpoints
- `schemas/knowledge-base.sql` - Database tables

**Frontend:**
- `src/pages/KnowledgeBase.tsx` - Main page
- `src/components/KnowledgeBaseList.tsx` - List view
- `src/components/KnowledgeBaseDetails.tsx` - Details/search
- `src/components/DocumentUploader.tsx` - Upload UI
- `src/services/knowledgeBaseService.ts` - API service

**Types:**
- Updated `src/types/index.ts` with KB types

---

## 🎯 Next: Link to Agents (Optional)

To make agents reference knowledge bases, see [KNOWLEDGE_BASE_COMPLETE.md](KNOWLEDGE_BASE_COMPLETE.md)

---

## 🐛 Troubleshooting

| Error | Fix |
|-------|-----|
| "npm install fails" | Delete `node_modules`, try again |
| "Can't find pdf-parse" | Run `npm install` in backend |
| "API Key errors" | Check `OPENAI_API_KEY` in .env |
| "SQL execution fails" | Make sure you're connected to MSSQL |
| "Upload button disabled" | Check network tab for API errors |

---

## 📊 What It Does

```
Upload PDF
  ↓
Extract text (pdf-parse)
  ↓
Split into chunks (overlapping)
  ↓
Generate embeddings (OpenAI API)
  ↓
Store vectors in database
  ↓
Ready for search!

Search query
  ↓
Convert to embedding
  ↓
Find similar chunks (cosine similarity)
  ↓
Return top 5 ranked by match %
```

---

**That's it! You now have a production-ready Knowledge Base system.** 🎉

For detailed setup, see [KNOWLEDGE_BASE_SETUP.md](KNOWLEDGE_BASE_SETUP.md)
For full documentation, see [KNOWLEDGE_BASE_COMPLETE.md](KNOWLEDGE_BASE_COMPLETE.md)
