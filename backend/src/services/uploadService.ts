// src/services/uploadService.ts

import path from "path";
import fs from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const CONVERSATIONS_DIR = path.join(UPLOADS_DIR, "conversations");
const TASKS_DIR = path.join(UPLOADS_DIR, "tasks");

[UPLOADS_DIR, CONVERSATIONS_DIR, TASKS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export interface FileAttachment {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface MessageAttachment extends FileAttachment {
  messageId: string;
}

export interface TaskAttachment extends FileAttachment {
  taskId: string;
  uploadedBy: string;
}

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class UploadService {
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: images, PDFs, Office documents, and text files.`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      };
    }

    return { valid: true };
  }

  async saveMessageAttachment(
    messageId: string,
    file: Express.Multer.File
  ): Promise<MessageAttachment> {
    try {
      // Generate unique filename
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;
      const filePath = path.join(CONVERSATIONS_DIR, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // For now, just return the attachment info without database persistence
      // TODO: Add Supabase table for attachments when schema is updated
      const attachment: MessageAttachment = {
        id: uuidv4(),
        messageId,
        fileName,
        originalFileName: file.originalname,
        filePath,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date(),
      };

      return attachment;
    } catch (error: any) {
      throw new Error(`Failed to save message attachment: ${error.message}`);
    }
  }

  async saveTaskAttachment(
    taskId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<TaskAttachment> {
    try {
      // Generate unique filename
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;
      const filePath = path.join(TASKS_DIR, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // For now, just return the attachment info without database persistence
      // TODO: Add Supabase table for attachments when schema is updated
      const attachment: TaskAttachment = {
        id: uuidv4(),
        taskId,
        fileName,
        originalFileName: file.originalname,
        filePath,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userId,
        uploadedAt: new Date(),
      };

      return attachment;
    } catch (error: any) {
      throw new Error(`Failed to save task attachment: ${error.message}`);
    }
  }

  async getMessageAttachments(messageId: string): Promise<MessageAttachment[]> {
    // TODO: Implement with Supabase when attachments table is created
    // For now, return empty array
    return [];
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    // TODO: Implement with Supabase when attachments table is created
    // For now, return empty array
    return [];
  }

  async deleteAttachment(attachmentId: string, type: "message" | "task"): Promise<void> {
    // TODO: Implement with Supabase when attachments table is created
    // For now, this is a no-op
  }

  getFilePath(fileName: string, type: "conversation" | "task"): string {
    return type === "conversation"
      ? path.join(CONVERSATIONS_DIR, fileName)
      : path.join(TASKS_DIR, fileName);
  }
}

export const uploadService = new UploadService();
