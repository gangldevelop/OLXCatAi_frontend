import React, { useEffect, useState } from 'react';
import { makeStyles, tokens, Text, TabList, Tab, Button } from '@fluentui/react-components';
import { HomeRegular, FolderRegular, SettingsRegular, MailRegular} from '@fluentui/react-icons';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import Settings from './components/Settings';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { CategoryUpdates } from './components/CategoryUpdates';
import ReportingDashboardFluent from './components/ReportingDashboard';
import { useCategories, useEmails, useSettings, useOffice } from './hooks';
import { signOut } from './lib/outlookAuth';
import { Category, Email, UserSettings } from './types';

const useStyles = makeStyles({
  app: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    backgroundImage:
      'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(56, 113, 220, 0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXL}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    '@media (max-width: 600px)': {
      padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    },
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: tokens.spacingVerticalS,
      alignItems: 'flex-start',
    },
    '@media (max-width: 400px)': {
      flexDirection: 'row',
      gap: tokens.spacingVerticalXS,
      alignItems: 'center',
    },
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0f6cbd 0%, #3b82f6 100%)',
    color: '#ffffff',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    '@media (max-width: 768px)': {
      fontSize: '16px',
    },
    '@media (max-width: 400px)': {
      fontSize: '14px',
    },
  },
  main: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  navigation: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  tabsWrap: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    '& [role="tab"]': {
      minWidth: 0,
      flex: 1,
      padding: '6px 8px',
      fontSize: '11px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flexShrink: 1,
      color: '#64748b',
      borderRadius: '8px',
    },
    '& [role="tab"]:hover': {
      color: '#1e293b',
      backgroundColor: '#f0f7ff',
    },
    '& [role="tab"][aria-selected="true"]': {
      color: '#0f6cbd',
      fontWeight: '600' as any,
      backgroundColor: '#f0f7ff',
    },
    '& [role="tab"] [data-icon]': {
      width: '12px',
      height: '12px',
      marginRight: '4px',
      color: 'inherit',
      flexShrink: 0,
    },
    '& [role="tab"] span': {
      fontSize: '11px',
      lineHeight: '1.2',
      fontWeight: 'inherit',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  navigationTitle: {
    fontSize: '15px',
    fontWeight: '600' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    '@media (max-width: 768px)': {
      fontSize: '13px',
    },
    '@media (max-width: 400px)': {
      fontSize: '12px',
    },
  },
  signOutButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  burgerMenu: {
    display: 'none',
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'auto',
    backgroundColor: 'transparent',
    maxWidth: '100%',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    minHeight: '44px',
  },
  menuItemIcon: {
    fontSize: tokens.fontSizeBase400,
  },
  menuItemText: {
    fontSize: tokens.fontSizeBase300,
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
    color: '#0f6cbd',
  },
});

const App: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('home');
  const [homeSubview, setHomeSubview] = useState<'dashboard' | 'categories'>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [emailsCategoryFilter, setEmailsCategoryFilter] = useState<{ categoryId?: string; folderId?: string } | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryActive, importFromOutlook } = useCategories();
  const { emails, updateEmail, markAsProcessed, assignCategory } = useEmails();
  const { settings, updateSettings, toggleSetting } = useSettings();
  const { isOfficeReady } = useOffice();

  // Don't call ensureTokens here - SignInGate handles auth
  // Calling it here can cause conflicts and freezes

  const handleTabSelect = (tab: string) => {
    if (tab === 'emails') {
      setEmailsCategoryFilter(null);
    }
    setSelectedTab(tab);
    setHomeSubview('dashboard');
    setIsMenuOpen(false);
  };

  const handleNavigate = (section: string, options?: { filterCategoryId?: string; filterFolderId?: string }) => {
    if (section === 'categories') {
      setHomeSubview('categories');
      return;
    }
    if (section === 'emails') {
      setEmailsCategoryFilter({ categoryId: options?.filterCategoryId, folderId: options?.filterFolderId });
      setSelectedEmail(null);
    }
    setSelectedTab(section);
  };

  const handleCategoryChange = (newCategories: Category[]) => {
    // For now, we'll handle this through the hook methods
    // In the future, this will be replaced with API calls
    console.log('Categories updated:', newCategories);
  };

  // const handleEmailUpdate = (newEmails: Email[]) => {
  //   newEmails.forEach(ne => {
  //     const prev = emails.find(e => e.id === ne.id)
  //     if (!prev) return
  //     const updates: Partial<Email> = {}
  //     if (prev.categoryId !== ne.categoryId) updates.categoryId = ne.categoryId
  //     if (prev.isProcessed !== ne.isProcessed) updates.isProcessed = ne.isProcessed
  //     if (Object.keys(updates).length > 0) {
  //       updateEmail(ne.id, updates)
  //     }
  //   })
  // };

  const handleSettingsChange = (newSettings: UserSettings) => {
    updateSettings(newSettings);
  };

  // const getTabTitle = () => {
  //   switch (selectedTab) {
  //     case 'home':
  //       return 'Home';
  //     case 'emails':
  //       return 'Emails';
  //     case 'categories':
  //       return 'Category Manager';
  //     case 'monitoring':
  //       return 'Email Monitoring';
  //     case 'settings':
  //       return 'Settings';
  //     default:
  //       return 'Home';
  //   }
  // };

  // const getTabIcon = () => {
  //   switch (selectedTab) {
  //     case 'home':
  //       return <HomeRegular />;
  //     case 'emails':
  //       return <MailRegular />;
  //     case 'categories':
  //       return <FolderRegular />;
  //     case 'monitoring':
  //       return <MailRegular />;
  //     case 'settings':
  //       return <SettingsRegular />;
  //     default:
  //       return <HomeRegular />;
  //   }
  // };

  const renderContent = () => {
    switch (selectedTab) {
      case 'home':
        return homeSubview === 'categories' ? (
          <CategoryManager
            categories={categories}
            onCategoryChange={handleCategoryChange}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onToggleCategoryActive={toggleCategoryActive}
            onImportFromOutlook={importFromOutlook}
            onBack={() => setHomeSubview('dashboard')}
          />
        ) : (
          <Dashboard
            emails={emails}
            categories={categories}
            onNavigate={handleNavigate}
          />
        );
      case 'emails':
        return selectedEmail ? (
          <EmailDetail
            email={selectedEmail}
            categories={categories}
            onBack={() => setSelectedEmail(null)}
            onUpdated={(u) => {
              setSelectedEmail(prev => prev ? { ...prev, ...u } as Email : prev)
              if (u) updateEmail(selectedEmail!.id, u)
            }}
          />
        ) : (
          <EmailList onSelect={(e) => setSelectedEmail(e)} categoryFilter={emailsCategoryFilter || undefined} />
        )
      case 'monitoring':
        return (
          <div style={{ padding: tokens.spacingHorizontalL }}>
            <SubscriptionStatus />
            <div style={{ marginTop: tokens.spacingVerticalL }}>
              <CategoryUpdates />
            </div>
          </div>
        );
      case 'reports':
        return (
          <div style={{ padding: tokens.spacingHorizontalXL }}>
            <ReportingDashboardFluent categories={categories} />
          </div>
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onToggleSetting={toggleSetting}
          />
        );
      default:
        return (
          <Dashboard
            emails={emails}
            categories={categories}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <FolderRegular />
            </div>
            <Text className={styles.logoText}>OLXCatAI</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              size="small"
              className={styles.signOutButton}
              appearance="secondary"
              onClick={async () => {
                await signOut()
              }}
            >
              Sign Out
            </Button>
            <Button
              size="small"
              className={styles.signOutButton}
              appearance="secondary"
              onClick={async () => {
                await signOut({ promptSelectAccount: true })
              }}
            >
              Switch account
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.navigation}>
          <div className={styles.tabsWrap}>
            <TabList 
              size="small" 
              selectedValue={selectedTab} 
              onTabSelect={(_, data) => handleTabSelect(String(data.value))}
            >
              <Tab icon={<HomeRegular />} value="home">Home</Tab>
              <Tab icon={<MailRegular />} value="emails">Emails</Tab>
              <Tab icon={<SettingsRegular />} value="settings">Settings</Tab>
              <Tab icon={<FolderRegular />} value="reports">Reports</Tab>
            </TabList>
          </div>
        </div>

        <div className={styles.content}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App; 