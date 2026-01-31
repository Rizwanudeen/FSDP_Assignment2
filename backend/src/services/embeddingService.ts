import OpenAI from 'openai';

export class EmbeddingService {
  private static client: OpenAI | null = null;
  private static model = 'text-embedding-3-small'; // Using smaller model for cost efficiency

  /**
   * Get or initialize OpenAI client
   */
  private static getClient(): OpenAI {
    if (!this.client) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not set');
      }
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.client;
  }

  /**
   * Generate embedding for a single text chunk
   * Returns vector as array of numbers
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const client = this.getClient();
      
      // Clean text to avoid issues
      const cleanText = text.trim().substring(0, 8191); // Max token limit
      
      const response = await client.embeddings.create({
        model: this.model,
        input: cleanText,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding returned from API');
      }

      return response.data[0].embedding;
    } catch (error: any) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple chunks in batch
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const client = this.getClient();

      // Clean texts
      const cleanTexts = texts.map((t) => t.trim().substring(0, 8191));

      const response = await client.embeddings.create({
        model: this.model,
        input: cleanTexts,
      });

      if (!response.data) {
        throw new Error('No embeddings returned from API');
      }

      // Sort by index to maintain order
      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      return embeddings;
    } catch (error: any) {
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  static euclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let sumSquares = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sumSquares += diff * diff;
    }

    return Math.sqrt(sumSquares);
  }

  /**
   * Serialize vector to JSON string for storage
   */
  static serializeVector(vector: number[]): string {
    return JSON.stringify(vector);
  }

  /**
   * Deserialize vector from JSON string
   */
  static deserializeVector(json: string): number[] {
    return JSON.parse(json);
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
   * Get embedding model information
   */
  static getModelInfo() {
    return {
      model: this.model,
      dimensions: 1536, // text-embedding-3-small has 1536 dimensions
      maxTokens: 8191,
      costPer1mTokens: 0.02, // Approximate cost
    };
  }
}
