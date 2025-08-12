declare global {
  interface Window {
    Office: any;
    OfficeRuntime?: {
      auth?: {
        getAccessToken?: (options?: { allowSignInPrompt?: boolean }) => Promise<string | null>
      }
    }
    OLXCatAI: {
      getCurrentEmailData(): Promise<{ subject: string; sender: string; body: string; receivedDate: Date; id: string; }>;
      categorizeEmail(categoryName: string): Promise<{ success: boolean; category: string }>;
      getUserFolders(): Promise<Array<{ name: string; id: string }>>;
      createFolder(folderName: string): Promise<{ success: boolean; folderName: string }>;
      moveEmailToFolder(folderId: string): Promise<{ success: boolean; folderId: string }>;
      getUserProfile(): Promise<{ displayName: string; email: string; id: string; }>;
    };
  }
}

export {}; 