import { Request, Response } from 'express';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';
import { logger } from '../utils/logger';

export class KnowledgeBaseController {
  // Create knowledge base
  createKB = async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      const userId = (req as any).user?.id;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Knowledge base name is required',
        });
      }

      const kb = await KnowledgeBaseService.createKnowledgeBase(
        userId,
        name,
        description
      );

      res.status(201).json({
        success: true,
        data: kb,
        message: 'Knowledge base created successfully',
      });
    } catch (error: any) {
      logger.error('Create KB controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Get all knowledge bases for user
  getKBs = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const kbs = await KnowledgeBaseService.getUserKnowledgeBases(userId);

      res.status(200).json({
        success: true,
        data: kbs,
      });
    } catch (error: any) {
      logger.error('Get KBs controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Get single knowledge base
  getKB = async (req: Request, res: Response) => {
    try {
      const { kbId } = req.params;
      const userId = (req as any).user?.id;

      const kb = await KnowledgeBaseService.getKnowledgeBase(kbId, userId);

      if (!kb) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge base not found',
        });
      }

      res.status(200).json({
        success: true,
        data: kb,
      });
    } catch (error: any) {
      logger.error('Get KB controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Delete knowledge base
  deleteKB = async (req: Request, res: Response) => {
    try {
      const { kbId } = req.params;
      const userId = (req as any).user?.id;

      await KnowledgeBaseService.deleteKnowledgeBase(kbId, userId);

      res.status(200).json({
        success: true,
        message: 'Knowledge base deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete KB controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Upload document
  uploadDocument = async (req: Request, res: Response) => {
    try {
      const { kbId } = req.params;
      const userId = (req as any).user?.id;
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const fileType = file.originalname.split('.').pop() || 'txt';

      const result = await KnowledgeBaseService.uploadDocument(
        kbId,
        userId,
        file.buffer,
        file.originalname,
        fileType
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Document uploaded and processed successfully',
      });
    } catch (error: any) {
      logger.error('Upload document controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Get documents in knowledge base
  getDocuments = async (req: Request, res: Response) => {
    try {
      const { kbId } = req.params;
      const userId = (req as any).user?.id;

      const documents = await KnowledgeBaseService.getDocuments(kbId, userId);

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      logger.error('Get documents controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Delete document
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const { kbId, docId } = req.params;
      const userId = (req as any).user?.id;

      await KnowledgeBaseService.deleteDocument(docId, kbId, userId);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete document controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Search knowledge base
  search = async (req: Request, res: Response) => {
    try {
      const { kbId } = req.params;
      const { query, topK = 5 } = req.body;
      const userId = (req as any).user?.id;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      // Verify KB ownership
      const kb = await KnowledgeBaseService.getKnowledgeBase(kbId, userId);
      if (!kb) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge base not found',
        });
      }

      const results = await KnowledgeBaseService.searchKnowledgeBase(
        kbId,
        query,
        topK
      );

      res.status(200).json({
        success: true,
        data: {
          query,
          results,
          count: results.length,
        },
      });
    } catch (error: any) {
      logger.error('Search KB controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Get KB stats
  getStats = async (req: Request, res: Response) => {
    try {
      const { kbId } = req.params;
      const userId = (req as any).user?.id;

      const stats = await KnowledgeBaseService.getKBStats(kbId, userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get stats controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // Get search history
  getSearchHistory = async (req: Request, res: Response) => {
    try {
      const { kbId } = req.params;
      const { limit = 20 } = req.query;
      const userId = (req as any).user?.id;

      const history = await KnowledgeBaseService.getSearchHistory(
        kbId,
        userId,
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      logger.error('Get search history controller error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export default new KnowledgeBaseController();
