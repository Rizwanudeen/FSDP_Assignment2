# Knowledge Base System - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (React)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Dashboard                                                          │
│    ↓ Click "Knowledge Base" button                                 │
│    ↓                                                                │
│  Knowledge Base Page                                               │
│    ├─ Left: Getting Started Guide                                 │
│    └─ Right: KB List                                              │
│       ├─ Create New KB                                            │
│       └─ Select KB                                                │
│          ↓                                                         │
│       KB Details Page                                             │
│          ├─ Tab 1: Documents                                      │
│          │  ├─ DocumentUploader (Drag & Drop)                    │
│          │  └─ Document List                                     │
│          │     ├─ Filename, Size, Chunks                        │
│          │     └─ Delete button                                  │
│          │                                                        │
│          └─ Tab 2: Search                                        │
│             ├─ Search Input                                      │
│             └─ Results List                                      │
│                ├─ Document name                                  │
│                ├─ Text excerpt                                   │
│                └─ Relevance score (0-100%)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────────┘
            ↓ HTTP Requests (JSON + FormData)
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS API BACKEND                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Routes: /api/knowledge-bases                                      │
│  Routes: /api/knowledge-bases/:kbId/documents                      │
│  Routes: /api/knowledge-bases/:kbId/search                         │
│                                                                    │
│              ↓                                                     │
│                                                                   │
│  knowledgeBaseController                                          │
│  ├─ createKB()                                                   │
│  ├─ getKBs()                                                     │
│  ├─ getKB()                                                      │
│  ├─ deleteKB()                                                   │
│  ├─ uploadDocument()    ← File upload handling (Multer)         │
│  ├─ getDocuments()                                               │
│  ├─ deleteDocument()                                             │
│  ├─ search()            ← Main search logic                      │
│  ├─ getStats()                                                   │
│  └─ getSearchHistory()                                           │
│                                                                  │
│              ↓                                                    │
│                                                                  │
│  knowledgeBaseService (Business Logic)                           │
│  ├─ createKnowledgeBase()                                        │
│  ├─ uploadDocument()                                             │
│  │   ├─ DocumentProcessingService.processDocument()             │
│  │   │   ├─ parsePDF() / parseDOCX() / parseTXT()              │
│  │   │   ├─ cleanText()                                         │
│  │   │   ├─ chunkText()    ← Split into 2000 char chunks       │
│  │   │   └─ estimateTokenCount()                                │
│  │   │                                                           │
│  │   └─ EmbeddingService.generateEmbeddings()                   │
│  │       ├─ Call OpenAI API for each chunk                      │
│  │       └─ Return 1536-dimensional vectors                     │
│  │                                                               │
│  ├─ searchKnowledgeBase()                                        │
│  │   ├─ EmbeddingService.generateEmbedding(query)               │
│  │   ├─ Fetch all chunk vectors from DB                         │
│  │   ├─ EmbeddingService.cosineSimilarity()  ← Calculate scores │
│  │   └─ Sort and return top K results                           │
│  │                                                               │
│  ├─ getDocuments()                                               │
│  ├─ deleteDocument()                                             │
│  ├─ getKBStats()                                                 │
│  └─ getSearchHistory()                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────────┘
            ↓ SQL Queries
┌─────────────────────────────────────────────────────────────────────┐
│                       MSSQL DATABASE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  KnowledgeBases Table                                              │
│  ├─ id (UUID)                                                      │
│  ├─ userId (UUID)  ← Foreign key to Users                         │
│  ├─ name                                                           │
│  ├─ description                                                    │
│  └─ timestamps                                                     │
│                                                                    │
│  Documents Table                                                   │
│  ├─ id (UUID)                                                      │
│  ├─ kbId (UUID)  ← Foreign key to KnowledgeBases                 │
│  ├─ filename                                                       │
│  ├─ fileType (pdf, docx, txt, md)                                │
│  ├─ content (full parsed text)                                    │
│  ├─ fileSize                                                       │
│  └─ isProcessed flag                                              │
│                                                                    │
│  DocumentChunks Table  ← WHERE MAGIC HAPPENS                      │
│  ├─ id (UUID)                                                      │
│  ├─ documentId (UUID)  ← Foreign key to Documents                │
│  ├─ chunkIndex (position)                                         │
│  ├─ chunkText (original text ~500 tokens)                        │
│  ├─ embedding (serialized vector [1536 dimensions])              │
│  └─ tokenCount                                                     │
│                                                                    │
│  KBSearchHistory Table  ← For analytics                           │
│  ├─ id (UUID)                                                      │
│  ├─ kbId, userId, searchQuery                                     │
│  └─ resultsReturned, searchedAt                                   │
│                                                                    │
│  Indexes:                                                          │
│  ├─ idx_kb_user (fast user lookups)                              │
│  ├─ idx_doc_kb (fast document lookups)                           │
│  ├─ idx_chunk_document (fast chunk lookups)                      │
│  └─ idx_search_kb (fast analytics queries)                       │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
            ↓ API calls
┌─────────────────────────────────────────────────────────────────────┐
│              EXTERNAL: OpenAI Embeddings API                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Model: text-embedding-3-small                                     │
│  Input: Text chunks (~500 tokens max)                              │
│  Output: 1536-dimensional vector                                   │
│  Cost: $0.02 per 1M tokens                                        │
│                                                                    │
│  Usage:                                                            │
│  ├─ Document upload: Generate embeddings for all chunks           │
│  └─ Search: Generate embedding for query                          │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Upload Document

```
User selects file
    ↓
Frontend: DocumentUploader component
    ├─ Validate file type (PDF, DOCX, TXT, MD)
    ├─ Validate file size (<25MB)
    └─ Create FormData with file
        ↓
API: POST /api/knowledge-bases/:kbId/documents
    ↓
Backend: knowledgeBaseController.uploadDocument()
    ├─ Extract file from request
    └─ Call knowledgeBaseService.uploadDocument()
        ↓
Service: knowledgeBaseService.uploadDocument()
    ├─ Verify KB ownership
    ├─ Call DocumentProcessingService.processDocument()
    │   ├─ Detect file type
    │   ├─ Parse content (PDF → text, DOCX → text, etc)
    │   ├─ Clean text (normalize whitespace)
    │   ├─ Split into chunks (2000 chars, 200 overlap)
    │   └─ Estimate token count
    │       ↓
    ├─ Store Document in DB
    │   INSERT INTO Documents (...)
    │
    ├─ Call EmbeddingService.generateEmbeddings()
    │   └─ OpenAI API: Convert all chunks to vectors
    │       (Each vector = 1536 dimensions)
    │       ↓
    └─ Store DocumentChunks in DB
        FOR each chunk:
            INSERT INTO DocumentChunks (
                documentId, chunkIndex, chunkText, 
                embedding (serialized vector), tokenCount
            )
        ↓
Frontend: Display success message
    ├─ Show "Upload Successful"
    ├─ Display filename + chunk count
    └─ Refresh document list
```

---

## Data Flow: Search Knowledge Base

```
User types query
    ↓
Frontend: Search form
    └─ Click Search
        ↓
API: POST /api/knowledge-bases/:kbId/search
    Query: { query: "user input", topK: 5 }
        ↓
Backend: knowledgeBaseController.search()
    └─ Call knowledgeBaseService.searchKnowledgeBase()
        ↓
Service: searchKnowledgeBase()
    ├─ Generate embedding for query
    │   └─ OpenAI API: Convert query to vector
    │       ↓
    ├─ Fetch all DocumentChunks for KB
    │   SELECT * FROM DocumentChunks
    │   WHERE documentId IN (
    │       SELECT id FROM Documents WHERE kbId = ?
    │   )
    │   ↓
    ├─ Calculate similarity for each chunk
    │   FOR each chunk:
    │       similarity = cosineSimilarity(
    │           queryVector,
    │           chunkVector
    │       )
    │       Result: score between 0 and 1
    │       ↓
    ├─ Sort by similarity (descending)
    │   ↓
    ├─ Return top 5 results
    │   [
    │     { id, text, filename, similarity: 0.87 },
    │     { id, text, filename, similarity: 0.82 },
    │     ...
    │   ]
    │   ↓
    └─ Log search to KBSearchHistory (for analytics)
        ↓
Frontend: Display search results
    └─ Results tab populated
        ├─ Result 1: 87% match
        ├─ Result 2: 82% match
        └─ ...
```

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│      Users          │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ name                │
└───────────┬─────────┘
            │ 1:N
            ↓
┌─────────────────────────┐
│    KnowledgeBases       │
├─────────────────────────┤
│ id (PK)                 │
│ userId (FK) → Users     │
│ name                    │
│ description             │
│ isActive                │
│ createdAt, updatedAt    │
└───────────┬─────────────┘
            │ 1:N
            ↓
┌──────────────────────────┐
│     Documents            │
├──────────────────────────┤
│ id (PK)                  │
│ kbId (FK) → KBases       │
│ filename                 │
│ fileType                 │
│ content                  │
│ fileSize                 │
│ isProcessed              │
│ uploadedAt               │
└───────────┬──────────────┘
            │ 1:N
            ↓
┌──────────────────────────┐
│   DocumentChunks         │
├──────────────────────────┤
│ id (PK)                  │
│ documentId (FK)          │
│ chunkIndex               │
│ chunkText                │
│ embedding (VECTOR)       │ ← The magic!
│ tokenCount               │
│ createdAt                │
└──────────────────────────┘

┌──────────────────────────┐
│  KBSearchHistory         │
├──────────────────────────┤
│ id (PK)                  │
│ kbId (FK)                │
│ userId (FK)              │
│ searchQuery              │
│ resultsReturned          │
│ searchedAt               │
└──────────────────────────┘
```

---

## Technology Stack

```
┌─ Frontend ────────────────────────────┐
│ React 18                              │
│ TypeScript                            │
│ TanStack React Query (API caching)    │
│ Axios (HTTP client)                   │
│ Tailwind CSS (styling)                │
│ Lucide React (icons)                  │
└───────────────────────────────────────┘

┌─ Backend ─────────────────────────────┐
│ Express.js                            │
│ TypeScript                            │
│ Multer (file upload)                  │
│ pdf-parse (PDF parsing)               │
│ Mammoth (DOCX parsing)                │
│ OpenAI SDK (embeddings)               │
└───────────────────────────────────────┘

┌─ Database ────────────────────────────┐
│ MSSQL Server                          │
│ Connection pooling                    │
│ Indexes for performance               │
│ UUID primary keys                     │
└───────────────────────────────────────┘

┌─ External Services ───────────────────┐
│ OpenAI Embeddings API                 │
│ (text-embedding-3-small)              │
└───────────────────────────────────────┘
```

---

## Performance Profile

```
Operation                 Time      Cost
────────────────────────────────────────
Upload 10MB PDF          3-5s      $0.02-0.05
Parse document           1-2s      (local)
Generate 50 embeddings   2-3s      $0.01 (50 chunks)
Search KB (1000 docs)    50-100ms  (local)
Store vectors            <10ms     (local)
Retrieve KB list         <50ms     (DB query)
────────────────────────────────────────
```

---

**Architecture designed for scalability, performance, and ease of integration with AI agents!**
