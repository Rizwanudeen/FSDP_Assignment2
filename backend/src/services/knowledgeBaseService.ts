import crypto from 'crypto';
import { db } from '../config/database';
import { logger } from '../utils/logger';
import { DocumentProcessingService } from './documentProcessingService';
import { EmbeddingService } from './embeddingService';

export class KnowledgeBaseService {
  /**
   * Create a new knowledge base
   */
  static async createKnowledgeBase(
    userId: string,
    name: string,
    description?: string
  ) {
    try {
      const id = crypto.randomUUID();
      
      await db.query(
        `INSERT INTO KnowledgeBases (id, userId, name, description, isActive)
         VALUES (@id, @userId, @name, @description, 1)`,
        {
          id,
          userId,
          name,
          description: description || '',
        }
      );

      logger.info(`Knowledge base created: ${id} for user ${userId}`);
      return { id, userId, name, description, isActive: true };
    } catch (error: any) {
      logger.error('Create KB error:', error.message);
      throw error;
    }
  }

  /**
   * Get all knowledge bases for a user
   */
  static async getUserKnowledgeBases(userId: string) {
    try {
      const rows = await db.query(
        `SELECT 
          kb.id, kb.name, kb.description, kb.isActive, kb.createdAt, kb.updatedAt,
          COUNT(DISTINCT d.id) as documentCount,
          COUNT(DISTINCT dc.id) as chunkCount
        FROM KnowledgeBases kb
        LEFT JOIN Documents d ON kb.id = d.kbId
        LEFT JOIN DocumentChunks dc ON d.id = dc.documentId
        WHERE kb.userId = @userId
        GROUP BY kb.id, kb.name, kb.description, kb.isActive, kb.createdAt, kb.updatedAt
        ORDER BY kb.createdAt DESC`,
        { userId }
      );

      return rows;
    } catch (error: any) {
      logger.error('Get KBs error:', error.message);
      throw error;
    }
  }

  /**
   * Get single knowledge base details
   */
  static async getKnowledgeBase(kbId: string, userId: string) {
    try {
      const rows = await db.query(
        `SELECT 
          kb.id, kb.name, kb.description, kb.isActive, kb.createdAt, kb.updatedAt,
          COUNT(DISTINCT d.id) as documentCount,
          COUNT(DISTINCT dc.id) as chunkCount
        FROM KnowledgeBases kb
        LEFT JOIN Documents d ON kb.id = d.kbId
        LEFT JOIN DocumentChunks dc ON d.id = dc.documentId
        WHERE kb.id = @kbId AND kb.userId = @userId
        GROUP BY kb.id, kb.name, kb.description, kb.isActive, kb.createdAt, kb.updatedAt`,
        { kbId, userId }
      );

      return rows[0] || null;
    } catch (error: any) {
      logger.error('Get KB error:', error.message);
      throw error;
    }
  }

  /**
   * Delete knowledge base and all associated data
   */
  static async deleteKnowledgeBase(kbId: string, userId: string) {
    try {
      // Verify ownership
      const kb = await this.getKnowledgeBase(kbId, userId);
      if (!kb) {
        throw new Error('Knowledge base not found or access denied');
      }

      await db.query(
        `DELETE FROM KnowledgeBases WHERE id = @kbId AND userId = @userId`,
        { kbId, userId }
      );

      logger.info(`Knowledge base deleted: ${kbId}`);
      return true;
    } catch (error: any) {
      logger.error('Delete KB error:', error.message);
      throw error;
    }
  }

  /**
   * Upload and process a document
   */
  static async uploadDocument(
    kbId: string,
    userId: string,
    buffer: Buffer,
    filename: string,
    fileType: string
  ) {
    const documentId = crypto.randomUUID();
    
    try {
      // Verify KB ownership
      const kb = await this.getKnowledgeBase(kbId, userId);
      if (!kb) {
        throw new Error('Knowledge base not found');
      }

      // Process document
      const { chunks, cleanText, tokenCount, chunkCount } =
        await DocumentProcessingService.processDocument(buffer, fileType);

      // Generate embeddings for all chunks
      logger.info(`Generating ${chunks.length} embeddings for document ${documentId}`);
      const embeddings = await EmbeddingService.generateEmbeddings(chunks);

      // Store document
      await db.query(
        `INSERT INTO Documents (id, kbId, filename, fileType, content, fileSize, isProcessed)
         VALUES (@id, @kbId, @filename, @fileType, @content, @fileSize, 1)`,
        {
          id: documentId,
          kbId,
          filename,
          fileType,
          content: cleanText,
          fileSize: buffer.length,
        }
      );

      // Store chunks with embeddings
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = crypto.randomUUID();
        const embeddingJson = EmbeddingService.serializeVector(embeddings[i]);

        await db.query(
          `INSERT INTO DocumentChunks (id, documentId, chunkIndex, chunkText, embedding, tokenCount)
           VALUES (@id, @documentId, @chunkIndex, @chunkText, @embedding, @tokenCount)`,
          {
            id: chunkId,
            documentId,
            chunkIndex: i,
            chunkText: chunks[i],
            embedding: embeddingJson,
            tokenCount: EmbeddingService.estimateTokenCount(chunks[i]),
          }
        );
      }

      logger.info(`Document uploaded: ${documentId} with ${chunks.length} chunks`);

      return {
        documentId,
        filename,
        fileType,
        chunkCount,
        tokenCount,
      };
    } catch (error: any) {
      logger.error('Upload document error:', error.message);
      
      // Mark document as failed
      try {
        await db.query(
          `UPDATE Documents SET isProcessed = 0, processingError = @error 
           WHERE id = @documentId`,
          { documentId, error: error.message }
        );
      } catch (e) {
        // Ignore if update fails
      }

      throw error;
    }
  }

  /**
   * Get all documents in a knowledge base
   */
  static async getDocuments(kbId: string, userId: string) {
    try {
      const rows = await db.query(
        `SELECT d.id, d.filename, d.fileType, d.fileSize, d.uploadedAt, d.isProcessed,
          COUNT(dc.id) as chunkCount
        FROM Documents d
        LEFT JOIN DocumentChunks dc ON d.id = dc.documentId
        WHERE d.kbId = @kbId 
          AND @kbId IN (SELECT id FROM KnowledgeBases WHERE userId = @userId)
        GROUP BY d.id, d.filename, d.fileType, d.fileSize, d.uploadedAt, d.isProcessed
        ORDER BY d.uploadedAt DESC`,
        { kbId, userId }
      );

      return rows;
    } catch (error: any) {
      logger.error('Get documents error:', error.message);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string, kbId: string, userId: string) {
    try {
      // Verify KB ownership
      const kb = await this.getKnowledgeBase(kbId, userId);
      if (!kb) {
        throw new Error('Knowledge base not found');
      }

      await db.query(
        `DELETE FROM Documents WHERE id = @documentId AND kbId = @kbId`,
        { documentId, kbId }
      );

      logger.info(`Document deleted: ${documentId}`);
      return true;
    } catch (error: any) {
      logger.error('Delete document error:', error.message);
      throw error;
    }
  }

  /**
   * Search knowledge base using semantic similarity
   * Returns most relevant chunks based on query embedding
   */
  static async searchKnowledgeBase(
    kbId: string,
    query: string,
    topK: number = 5
  ) {
    try {
      // Generate embedding for query
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);

      // Get all chunks from KB
      const chunks = await db.query(
        `SELECT dc.id, dc.chunkText, dc.embedding, d.filename
        FROM DocumentChunks dc
        JOIN Documents d ON dc.documentId = d.id
        WHERE d.kbId = @kbId
        ORDER BY dc.documentId, dc.chunkIndex`,
        { kbId }
      );

      if (chunks.length === 0) {
        return [];
      }

      // Calculate similarity for each chunk
      const results = chunks
        .map((chunk: any) => ({
          id: chunk.id,
          text: chunk.chunkText,
          filename: chunk.filename,
          similarity: EmbeddingService.cosineSimilarity(
            queryEmbedding,
            EmbeddingService.deserializeVector(chunk.embedding)
          ),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      // Log search
      await db.query(
        `INSERT INTO KBSearchHistory (id, kbId, userId, searchQuery, resultsReturned)
         VALUES (@id, @kbId, @userId, @query, @count)`,
        {
          id: crypto.randomUUID(),
          kbId,
          userId: 'system', // Would be actual user in real implementation
          query,
          count: results.length,
        }
      ).catch(() => {
        // Ignore logging errors
      });

      return results;
    } catch (error: any) {
      logger.error('Search KB error:', error.message);
      throw error;
    }
  }

  /**
   * Get search history for analytics
   */
  static async getSearchHistory(kbId: string, userId: string, limit: number = 20) {
    try {
      const rows = await db.query(
        `SELECT TOP @limit 
          id, searchQuery, resultsReturned, searchedAt
        FROM KBSearchHistory
        WHERE kbId = @kbId AND userId = @userId
        ORDER BY searchedAt DESC`,
        { kbId, userId, limit }
      );

      return rows;
    } catch (error: any) {
      logger.error('Get search history error:', error.message);
      throw error;
    }
  }

  /**
   * Get knowledge base statistics
   */
  static async getKBStats(kbId: string, userId: string) {
    try {
      const kb = await this.getKnowledgeBase(kbId, userId);
      
      if (!kb) {
        throw new Error('Knowledge base not found');
      }

      const stats = await db.query(
        `SELECT 
          (SELECT COUNT(*) FROM Documents WHERE kbId = @kbId) as totalDocuments,
          (SELECT COUNT(*) FROM DocumentChunks dc 
           JOIN Documents d ON dc.documentId = d.id 
           WHERE d.kbId = @kbId) as totalChunks,
          (SELECT SUM(fileSize) FROM Documents WHERE kbId = @kbId) as totalSize,
          (SELECT COUNT(*) FROM KBSearchHistory WHERE kbId = @kbId) as totalSearches,
          (SELECT COUNT(DISTINCT userId) FROM KBSearchHistory WHERE kbId = @kbId) as uniqueSearchers
        `,
        { kbId }
      );

      return {
        ...kb,
        ...stats[0],
      };
    } catch (error: any) {
      logger.error('Get KB stats error:', error.message);
      throw error;
    }
  }
}
