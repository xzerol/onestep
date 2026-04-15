export interface TextProvider {
  generateSellingPoints(input: {
    productName?: string | null;
    productInput: string;
    sourceImageUrl?: string | null;
  }): Promise<{
    sellingPoints: Array<{
      order: number;
      headline: string;
      body: string;
      imagePrompt: string;
    }>;
  }>;
}

export interface ImageProvider {
  generateImage(input: {
    prompt: string;
    referenceImageUrl?: string | null;
    aspectRatio?: string;
    size?: string;
    timeoutMs?: number;
    signal?: AbortSignal;
  }): Promise<{
    providerJobId?: string;
    imageUrl: string;
    rawResponse?: unknown;
  }>;
}
