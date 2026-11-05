export interface WeightItem {
  id: string;
  value: number;
  originalText: string;
  confidence: 'high' | 'medium' | 'low';
  note?: string;
  isEdited?: boolean;
}

export interface OcrResponseData {
  weights: {
    value: number;
    originalText: string;
    confidence: 'high' | 'medium' | 'low';
    note?: string;
  }[];
  detectedLanguage?: string;
  summaryNote?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  address?: string;
  pin?: string;
  avatarColor?: string;
  createdAt: number;
}

export interface BuyerInfo {
  buyerName?: string;
  itemType?: string;
  memoNo?: string;
  notes?: string;
}

export interface TallyRecord {
  id: string;
  title: string;
  timestamp: number;
  weights: WeightItem[];
  totalKg: number;
  tarePerItemKg: number;
  netKg: number;
  pricePerKg?: number;
  totalAmount?: number;
  imageDataUrl?: string;
  notes?: string;
  userId?: string;
  creatorName?: string;
  businessName?: string;
  buyerInfo?: BuyerInfo;
}

export type NumeralStyle = 'bangla' | 'english';

