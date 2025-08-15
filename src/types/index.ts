export interface Category {
  id: string;
  name: string;
  color: string;
  outlookFolderId: string | null;
  keywords?: string[];
  isActive: boolean;
}

export interface Email {
  id: string;
  subject: string;
  sender: string;
  body: string;
  receivedDate: Date;
  categoryId?: string;
  isProcessed: boolean;
  parentFolderId?: string;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  emailCount: number;
  lastProcessed: Date;
}

export interface UserSettings {
  autoCategorize: boolean;
  notifications: boolean;
  batchProcessing: boolean;
  privacyMode: boolean;
}

export {}