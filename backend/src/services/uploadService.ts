// src/services/uploadService.ts

import path from "path";
import fs from "fs";
import { Request } from "express";
import { supabase } from "../config/database";
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
    if (!pool) throw new Error("Database not connected");

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(CONVERSATIONS_DIR, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save to database
    const result = await pool
      .request()
      .input("messageId", sql.UniqueIdentifier, messageId)
      .input("fileName", sql.NVarChar, fileName)
      .input("originalFileName", sql.NVarChar, file.originalname)
      .input("filePath", sql.NVarChar, filePath)
      .input("fileType", sql.NVarChar, file.mimetype)
      .input("fileSize", sql.BigInt, file.size).query(`
        INSERT INTO MessageAttachments (messageId, fileName, originalFileName, filePath, fileType, fileSize)
        OUTPUT INSERTED.*
        VALUES (@messageId, @fileName, @originalFileName, @filePath, @fileType, @fileSize)
      `);

    return result.recordset[0];
  }

  async saveTaskAttachment(
    taskId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<TaskAttachment> {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(TASKS_DIR, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save to Supabase database
    const { data, error } = await supabase
      .from('task_attachments')
      .insert({
        id: uuidv4(),
        task_id: taskId,
        file_name: fileName,
        original_file_name: file.originalname,
        file_path: filePath,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      taskId: data.task_id,
      fileName: data.file_name,
      originalFileName: data.original_file_name,
      filePath: data.file_path,
      fileType: data.file_type,
      fileSize: data.file_size,
      uploadedBy: data.uploaded_by,
      uploadedAt: new Date(data.uploaded_at),
    };
  }

  async getMessageAttachments(messageId: string): Promise<MessageAttachment[]> {
    const { data, error } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      messageId: row.message_id,
      fileName: row.file_name,
      originalFileName: row.original_file_name,
      filePath: row.file_path,
      fileType: row.file_type,
      fileSize: row.file_size,
      uploadedAt: new Date(row.uploaded_at),
    }));
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      fileName: row.file_name,
      originalFileName: row.original_file_name,
      filePath: row.file_path,
      fileType: row.file_type,
      fileSize: row.file_size,
      uploadedBy: row.uploaded_by,
      uploadedAt: new Date(row.uploaded_at),
    }));
  }

  async deleteAttachment(attachmentId: string, type: "message" | "task"): Promise<void> {
    const tableName = type === "message" ? "message_attachments" : "task_attachments";
    const filePathColumn = "file_path";

    // Get file info
    const { data: fileData, error: selectError } = await supabase
      .from(tableName)
      .select(filePathColumn)
      .eq('id', attachmentId)
      .single();

    if (selectError) throw selectError;

    if (fileData) {
      const filePath = fileData[filePathColumn];

      // Delete file from disk
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', attachmentId);

      if (deleteError) throw deleteError;
    }
  }

  getFilePath(fileName: string, type: "conversation" | "task"): string {
    return type === "conversation"
      ? path.join(CONVERSATIONS_DIR, fileName)
      : path.join(TASKS_DIR, fileName);
  }
}

export const uploadService = new UploadService();
