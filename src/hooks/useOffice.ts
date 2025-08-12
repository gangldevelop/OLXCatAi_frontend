import { useState, useEffect, useCallback } from 'react';

interface OfficeEmailData {
  subject: string;
  sender: string;
  body: string;
  receivedDate: Date;
  id: string;
}

interface OfficeUserProfile {
  displayName: string;
  email: string;
  id: string;
}

interface OfficeFolder {
  name: string;
  id: string;
}

export const useOffice = () => {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<OfficeEmailData | null>(null);
  const [userProfile, setUserProfile] = useState<OfficeUserProfile | null>(null);
  const [folders, setFolders] = useState<OfficeFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeOffice = () => {
      if (typeof window !== 'undefined' && window.Office) {
        window.Office.onReady(() => {
          setIsOfficeReady(true);
          console.log('Office.js is ready');
        });
      } else {
        console.warn('Office.js not available - running in standalone mode');
        setIsOfficeReady(true);
      }
    };

    initializeOffice();
  }, []);

  const getCurrentEmailData = useCallback(async () => {
    if (!isOfficeReady) {
      console.warn('Office not ready yet');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.OLXCatAI) {
        const emailData = await window.OLXCatAI.getCurrentEmailData();
        setCurrentEmail(emailData);
        return emailData;
      } else {
        // Mock data for development
        const mockEmailData: OfficeEmailData = {
          subject: 'Sample Email Subject',
          sender: 'sender@example.com',
          body: 'This is a sample email body for testing purposes.',
          receivedDate: new Date(),
          id: 'mock-email-id'
        };
        setCurrentEmail(mockEmailData);
        return mockEmailData;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting current email data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isOfficeReady]);

  const categorizeEmail = useCallback(async (categoryName: string) => {
    if (!isOfficeReady) {
      console.warn('Office not ready yet');
      return { success: false, category: categoryName };
    }

    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.OLXCatAI) {
        const result = await window.OLXCatAI.categorizeEmail(categoryName);
        return result;
      } else {
        // Mock response for development
        console.log(`Mock categorization: ${categoryName}`);
        return { success: true, category: categoryName };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error categorizing email:', err);
      return { success: false, category: categoryName };
    } finally {
      setLoading(false);
    }
  }, [isOfficeReady]);

  const getUserFolders = useCallback(async () => {
    if (!isOfficeReady) {
      console.warn('Office not ready yet');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.OLXCatAI) {
        const folderData = await window.OLXCatAI.getUserFolders();
        setFolders(folderData);
        return folderData;
      } else {
        // Mock data for development
        const mockFolders: OfficeFolder[] = [
          { name: 'Inbox', id: 'inbox' },
          { name: 'Sent Items', id: 'sent' },
          { name: 'Drafts', id: 'drafts' },
          { name: 'Deleted Items', id: 'deleted' }
        ];
        setFolders(mockFolders);
        return mockFolders;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting user folders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isOfficeReady]);

  const createFolder = useCallback(async (folderName: string) => {
    if (!isOfficeReady) {
      console.warn('Office not ready yet');
      return { success: false, folderName };
    }

    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.OLXCatAI) {
        const result = await window.OLXCatAI.createFolder(folderName);
        if (result.success) {
          // Refresh folders list
          await getUserFolders();
        }
        return result;
      } else {
        // Mock response for development
        console.log(`Mock folder creation: ${folderName}`);
        const newFolder: OfficeFolder = { name: folderName, id: `mock-${Date.now()}` };
        setFolders(prev => [...prev, newFolder]);
        return { success: true, folderName };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error creating folder:', err);
      return { success: false, folderName };
    } finally {
      setLoading(false);
    }
  }, [isOfficeReady, getUserFolders]);

  const moveEmailToFolder = useCallback(async (folderId: string) => {
    if (!isOfficeReady) {
      console.warn('Office not ready yet');
      return { success: false, folderId };
    }

    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.OLXCatAI) {
        const result = await window.OLXCatAI.moveEmailToFolder(folderId);
        return result;
      } else {
        // Mock response for development
        console.log(`Mock email move to folder: ${folderId}`);
        return { success: true, folderId };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error moving email to folder:', err);
      return { success: false, folderId };
    } finally {
      setLoading(false);
    }
  }, [isOfficeReady]);

  const getUserProfile = useCallback(async () => {
    if (!isOfficeReady) {
      console.warn('Office not ready yet');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.OLXCatAI) {
        const profileData = await window.OLXCatAI.getUserProfile();
        setUserProfile(profileData);
        return profileData;
      } else {
        // Mock data for development
        const mockProfile: OfficeUserProfile = {
          displayName: 'Test User',
          email: 'test@example.com',
          id: 'mock-user-id'
        };
        setUserProfile(mockProfile);
        return mockProfile;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting user profile:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isOfficeReady]);

  useEffect(() => {
    if (isOfficeReady) {
      getCurrentEmailData();
      getUserFolders();
      getUserProfile();
    }
  }, [isOfficeReady, getCurrentEmailData, getUserFolders, getUserProfile]);

  return {
    isOfficeReady,
    currentEmail,
    userProfile,
    folders,
    loading,
    error,
    getCurrentEmailData,
    categorizeEmail,
    getUserFolders,
    createFolder,
    moveEmailToFolder,
    getUserProfile
  };
}; 