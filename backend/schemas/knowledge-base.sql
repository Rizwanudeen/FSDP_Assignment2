-- Knowledge Base Schema for MSSQL

-- Create KnowledgeBase table
CREATE TABLE KnowledgeBases (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Create Documents table
CREATE TABLE Documents (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    kbId UNIQUEIDENTIFIER NOT NULL,
    filename NVARCHAR(255) NOT NULL,
    fileType NVARCHAR(50) NOT NULL, -- pdf, doc, docx, txt, etc
    content NVARCHAR(MAX) NOT NULL, -- Full text content after parsing
    fileSize INT NOT NULL, -- Size in bytes
    uploadedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    isProcessed BIT NOT NULL DEFAULT 0,
    processingError NVARCHAR(MAX), -- Error message if processing failed
    FOREIGN KEY (kbId) REFERENCES KnowledgeBases(id) ON DELETE CASCADE
);

-- Create DocumentChunks table (for storing embeddings)
CREATE TABLE DocumentChunks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    documentId UNIQUEIDENTIFIER NOT NULL,
    chunkIndex INT NOT NULL, -- Position in document
    chunkText NVARCHAR(MAX) NOT NULL, -- Original text (max ~500 tokens for optimal embedding)
    embedding NVARCHAR(MAX) NOT NULL, -- Serialized vector as JSON array
    tokenCount INT, -- Approximate token count
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (documentId) REFERENCES Documents(id) ON DELETE CASCADE,
    INDEX idx_document_chunk (documentId, chunkIndex)
);

-- Create SearchHistory table (optional, for analytics)
CREATE TABLE KBSearchHistory (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    kbId UNIQUEIDENTIFIER NOT NULL,
    userId UNIQUEIDENTIFIER NOT NULL,
    searchQuery NVARCHAR(MAX) NOT NULL,
    resultsReturned INT,
    searchedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (kbId) REFERENCES KnowledgeBases(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Create indexes for performance
CREATE INDEX idx_kb_user ON KnowledgeBases(userId);
CREATE INDEX idx_doc_kb ON Documents(kbId);
CREATE INDEX idx_chunk_document ON DocumentChunks(documentId);
CREATE INDEX idx_search_kb ON KBSearchHistory(kbId, userId);

-- Verify tables created
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('KnowledgeBases', 'Documents', 'DocumentChunks', 'KBSearchHistory');
