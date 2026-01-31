import { Readable } from 'stream';
import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export class DocumentProcessingService {
  /**
   * Parse PDF file and extract text
   */
  static async parsePDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse DOCX file (using basic text extraction)
   * For production, use 'docx' or 'mammoth' package
   */
  static async parseDOCX(buffer: Buffer): Promise<string> {
    // Using mammoth for better DOCX parsing
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error: any) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse plain text file
   */
  static async parseTXT(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }

  /**
   * Parse Markdown file
   */
  static async parseMD(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }

  /**
   * Main document parser - routes to correct parser based on file type
   */
  static async parseDocument(
    buffer: Buffer,
    fileType: string
  ): Promise<string> {
    const type = fileType.toLowerCase();

    if (type === 'pdf') {
      return this.parsePDF(buffer);
    } else if (type === 'docx' || type === 'doc') {
      return this.parseDOCX(buffer);
    } else if (type === 'txt' || type === 'text') {
      return this.parseTXT(buffer);
    } else if (type === 'md' || type === 'markdown') {
      return this.parseMD(buffer);
    } else {
      // Default to text parsing
      return this.parseTXT(buffer);
    }
  }

  /**
   * Split text into chunks (by tokens/characters)
   * Each chunk should be around 500-1000 tokens for optimal embedding
   * Average: 1 token ≈ 4 characters
   */
  static chunkText(text: string, chunkSize: number = 2000): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    // Split by sentences first to maintain context
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Create overlapping chunks for better context preservation
   */
  static chunkTextWithOverlap(
    text: string,
    chunkSize: number = 2000,
    overlapSize: number = 200
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to break at a sentence boundary
      if (end < text.length) {
        const nextPeriod = text.indexOf('.', end);
        const nextQuestion = text.indexOf('?', end);
        const nextExclamation = text.indexOf('!', end);
        const boundaries = [nextPeriod, nextQuestion, nextExclamation].filter(
          (pos) => pos > end && pos !== -1
        );
        
        if (boundaries.length > 0) {
          end = Math.min(...boundaries) + 1;
        }
      }

      const chunk = text.substring(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      // Move start position with overlap
      start = end - overlapSize;
    }

    return chunks;
  }

  /**
   * Clean text by removing extra whitespace and normalizing
   */
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
      .trim();
  }

  /**
   * Count approximate tokens in text (rough estimate)
   * OpenAI: ~1 token = 4 characters for English
   */
  static estimateTokenCount(text: string): number {
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    
    // Use both methods and average them
    const estimateByWords = Math.ceil(words / 0.75); // Average 0.75 tokens per word
    const estimateByChars = Math.ceil(chars / 4); // Average 4 chars per token
    
    return Math.round((estimateByWords + estimateByChars) / 2);
  }

  /**
   * Process document end-to-end: parse, clean, chunk
   */
  static async processDocument(
    buffer: Buffer,
    fileType: string
  ): Promise<{
    chunks: string[];
    cleanText: string;
    tokenCount: number;
    chunkCount: number;
  }> {
    try {
      // Parse document
      let text = await this.parseDocument(buffer, fileType);
      
      // Clean text
      const cleanedText = this.cleanText(text);
      
      // Chunk text with overlap
      const chunks = this.chunkTextWithOverlap(cleanedText, 2000, 200);
      
      // Estimate tokens
      const tokenCount = this.estimateTokenCount(cleanedText);
      
      return {
        chunks,
        cleanText: cleanedText,
        tokenCount,
        chunkCount: chunks.length,
      };
    } catch (error: any) {
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }
}
