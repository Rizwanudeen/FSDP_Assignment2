import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import knowledgeBaseController from '../controllers/knowledgeBaseController';

const router = Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/json',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Knowledge Base routes
router.post('/knowledge-bases', authenticateToken, knowledgeBaseController.createKB);
router.get('/knowledge-bases', authenticateToken, knowledgeBaseController.getKBs);
router.get('/knowledge-bases/:kbId', authenticateToken, knowledgeBaseController.getKB);
router.delete('/knowledge-bases/:kbId', authenticateToken, knowledgeBaseController.deleteKB);

// Document routes
router.post(
  '/knowledge-bases/:kbId/documents',
  authenticateToken,
  upload.single('file'),
  knowledgeBaseController.uploadDocument
);

router.get(
  '/knowledge-bases/:kbId/documents',
  authenticateToken,
  knowledgeBaseController.getDocuments
);

router.delete(
  '/knowledge-bases/:kbId/documents/:docId',
  authenticateToken,
  knowledgeBaseController.deleteDocument
);

// Search routes
router.post(
  '/knowledge-bases/:kbId/search',
  authenticateToken,
  knowledgeBaseController.search
);

router.get(
  '/knowledge-bases/:kbId/stats',
  authenticateToken,
  knowledgeBaseController.getStats
);

router.get(
  '/knowledge-bases/:kbId/search-history',
  authenticateToken,
  knowledgeBaseController.getSearchHistory
);

export default router;
