export interface Tomica {
  id: string;
  name: string;
  series: string;
  releaseYear: number;
  imageUrl: string;
  nfcId: string;
  condition: 'new' | 'used';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  tomicas: Tomica[];
  createdAt: string;
  updatedAt: string;
} 