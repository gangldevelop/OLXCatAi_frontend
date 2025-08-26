export const testOfficeIntegration = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.Office) {
    console.warn('Office.js not available');
    return;
  }

  window.Office.onReady((info?: any) => {
    try {
      const context = window.Office?.context;
      console.log('Office is ready. Host:', context?.host);

      const diagnosticsVersion = context?.diagnostics?.version;
      if (diagnosticsVersion) {
        console.log('Office version:', diagnosticsVersion);
      }

      if (context?.host === window.Office?.HostType?.Outlook) {
        console.log('Running in Outlook environment');

        const mailbox = context?.mailbox;
        if (!mailbox) {
          console.warn('Mailbox not available');
          return;
        }

        const item = mailbox.item as any;
        if (!item) {
          console.warn('Mailbox item not available');
          return;
        }

        // Subject handling differs by mode. In Read mode, subject is a string; in Compose, it has getAsync.
        const subjectValue = typeof item.subject === 'string' ? item.subject : undefined;
        if (subjectValue) {
          console.log('Subject (read mode):', subjectValue);
        } else if (item.subject?.getAsync) {
          item.subject.getAsync((subjectResult: any) => {
            if (subjectResult?.status === window.Office?.AsyncResultStatus?.Succeeded || subjectResult?.status === 'succeeded') {
              console.log('Subject (compose mode):', subjectResult.value);
            } else {
              console.warn('Failed to get subject:', subjectResult?.error);
            }
          });
        }

        // Body retrieval using body.getAsync is supported in both modes
        if (item.body?.getAsync) {
          item.body.getAsync(window.Office?.CoercionType?.Text || 'text', (result: any) => {
            if (result?.status === window.Office?.AsyncResultStatus?.Succeeded || result?.status === 'succeeded') {
              console.log('Email body (text) retrieved successfully');
            } else {
              console.error('Failed to get email body:', result?.error);
            }
          });
        } else {
          console.warn('item.body.getAsync not available');
        }
      }
    } catch (error) {
      console.error('Error during Office integration test:', error);
    }
  });

  if ((window as any).OLXCatAI) {
    console.log('OLXCatAI functions available:', Object.keys((window as any).OLXCatAI));
  } else {
    console.log('OLXCatAI functions not available');
  }
};

export const getOfficeEnvironment = () => {
  const env = {
    hostType: typeof window !== 'undefined' && window.Office?.context?.host ? window.Office.context.host : null,
    isOutlook: typeof window !== 'undefined' && window.Office?.context?.host === window.Office?.HostType?.Outlook,
    mailboxAvailable: typeof window !== 'undefined' && !!window.Office?.context?.mailbox,
    olxcatAvailable: typeof window !== 'undefined' && !!window.OLXCatAI,
    officeVersion: typeof window !== 'undefined' && window.Office?.context?.diagnostics?.version ? window.Office.context.diagnostics.version : null
  };
  
  console.log('Office Environment:', env);
  return env;
};

export const simulateOfficeContext = () => {
  if (typeof window !== 'undefined' && !(window as any).Office) {
    console.log('Simulating Office context for development');
    
    (window as any).Office = {
      onReady: (callback: () => void) => {
        console.log('Office.onReady called');
        setTimeout(callback, 100);
      },
      context: {
        diagnostics: {
          version: '1.1.0'
        },
        host: 'outlook',
        mailbox: {
          item: {
            subject: 'Test Email Subject',
            from: { displayName: 'Test Sender', emailAddress: 'sender@test.com' },
            body: {
              getAsync: (coercionType: any, callback: any) => {
                setTimeout(() => {
                  callback({
                    status: 'succeeded',
                    value: 'This is a test email body'
                  });
                }, 100);
              }
            },
            getAsync: (coercionType: any, callback: any) => {
              setTimeout(() => {
                callback({
                  status: 'succeeded',
                  value: 'Test email content'
                });
              }, 100);
            }
          }
        }
      },
      HostType: {
        Outlook: 'outlook'
      },
      CoercionType: {
        Text: 'text',
        Html: 'html'
      },
      AsyncResultStatus: {
        Succeeded: 'succeeded',
        Failed: 'failed'
      }
    };

    (window as any).OLXCatAI = {
      getCurrentEmailData: async () => ({
        subject: 'Simulated Email Subject',
        sender: 'simulated@test.com',
        body: 'This is a simulated email body for testing purposes.',
        receivedDate: new Date(),
        id: 'simulated-email-id'
      }),
      categorizeEmail: async (categoryName: string) => ({
        success: true,
        category: categoryName
      }),
      getUserFolders: async () => [
        { name: 'Inbox', id: 'inbox' },
        { name: 'Sent Items', id: 'sent' },
        { name: 'Drafts', id: 'drafts' },
        { name: 'Deleted Items', id: 'deleted' }
      ],
      createFolder: async (folderName: string) => ({
        success: true,
        folderName
      }),
      moveEmailToFolder: async (folderId: string) => ({
        success: true,
        folderId
      }),
      getUserProfile: async () => ({
        displayName: 'Simulated User',
        email: 'simulated@test.com',
        id: 'simulated-user-id'
      })
    };
  }
}; 