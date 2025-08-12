export const testOfficeIntegration = () => {
  if (typeof window !== 'undefined' && window.Office) {
    console.log('Office.js is available');
    
    if (window.Office.context) {
      console.log('Office context is available');
      
      if (window.Office.context.diagnostics) {
        console.log('Office version:', window.Office.context.diagnostics.version);
      }
      
      if (window.Office.context.host) {
        console.log('Office host:', window.Office.context.host);
        
        if (window.Office.context.host === window.Office.HostType?.Outlook) {
          console.log('Running in Outlook environment');
          
          if (window.Office.context.mailbox) {
            console.log('Mailbox is available');
            
            window.Office.context.mailbox.item.getAsync(
              window.Office.CoercionType?.Text || 'text', 
              (result: any) => {
                if (result.status === window.Office.AsyncResultStatus?.Succeeded || result.status === 'succeeded') {
                  console.log('Email content retrieved successfully');
                } else {
                  console.error('Failed to get email content:', result.error);
                }
              }
            );
          }
        }
      }
    }
  } else {
    console.log('Office.js not available');
  }

  if (typeof window !== 'undefined' && (window as any).OLXCatAI) {
    console.log('OLXCatAI functions available:', Object.keys(window.OLXCatAI));
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