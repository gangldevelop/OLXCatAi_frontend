import React, { useEffect, useState } from 'react';
import { makeStyles, tokens, Text, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, MenuButton, Badge } from '@fluentui/react-components';
import { HomeRegular, FolderRegular, PlayRegular, SettingsRegular, MoreHorizontalRegular, MailRegular } from '@fluentui/react-icons';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import EmailProcessor from './components/EmailProcessor';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import Settings from './components/Settings';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { CategoryUpdates } from './components/CategoryUpdates';
import { useCategories, useEmails, useSettings, useOffice } from './hooks';
import { ensureTokens } from './lib/outlookAuth';
import { Category, Email, UserSettings } from './types';

const useStyles = makeStyles({
  app: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    '@media (max-width: 600px)': {
      padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
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
    gap: tokens.spacingHorizontalS,
  },
  logoText: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase300,
    },
    '@media (max-width: 400px)': {
      fontSize: tokens.fontSizeBase200,
    },
  },
  main: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  navigation: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    '@media (max-width: 768px)': {
      fontSize: tokens.fontSizeBase200,
    },
    '@media (max-width: 400px)': {
      fontSize: tokens.fontSizeBase100,
    },
  },
  burgerMenu: {
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
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
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
});

const App: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('emails');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryActive, importFromOutlook } = useCategories();
  const { emails, updateEmail, markAsProcessed, assignCategory } = useEmails();
  const { settings, updateSettings, toggleSetting } = useSettings();
  const { isOfficeReady } = useOffice();

  useEffect(() => {
    ensureTokens().catch(() => {})
  }, [])

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
    setIsMenuOpen(false);
  };

  const handleNavigate = (section: string) => {
    setSelectedTab(section);
  };

  const handleCategoryChange = (newCategories: Category[]) => {
    // For now, we'll handle this through the hook methods
    // In the future, this will be replaced with API calls
    console.log('Categories updated:', newCategories);
  };

  const handleEmailUpdate = (newEmails: Email[]) => {
    newEmails.forEach(ne => {
      const prev = emails.find(e => e.id === ne.id)
      if (!prev) return
      const updates: Partial<Email> = {}
      if (prev.categoryId !== ne.categoryId) updates.categoryId = ne.categoryId
      if (prev.isProcessed !== ne.isProcessed) updates.isProcessed = ne.isProcessed
      if (Object.keys(updates).length > 0) {
        updateEmail(ne.id, updates)
      }
    })
  };

  const handleSettingsChange = (newSettings: UserSettings) => {
    updateSettings(newSettings);
  };

  const getTabTitle = () => {
    switch (selectedTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'emails':
        return 'Emails';
      case 'categories':
        return 'Category Manager';
      case 'processing':
        return 'Email Processing';
      case 'monitoring':
        return 'Email Monitoring';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const getTabIcon = () => {
    switch (selectedTab) {
      case 'dashboard':
        return <HomeRegular />;
      case 'emails':
        return <HomeRegular />;
      case 'categories':
        return <FolderRegular />;
      case 'processing':
        return <PlayRegular />;
      case 'monitoring':
        return <MailRegular />;
      case 'settings':
        return <SettingsRegular />;
      default:
        return <HomeRegular />;
    }
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return (
          <Dashboard
            emails={emails}
            categories={categories}
            onNavigate={handleNavigate}
          />
        );
      case 'categories':
        return (
          <CategoryManager
            categories={categories}
            onCategoryChange={handleCategoryChange}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onToggleCategoryActive={toggleCategoryActive}
            onImportFromOutlook={importFromOutlook}
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
          <EmailList onSelect={(e) => setSelectedEmail(e)} />
        )
      case 'processing':
        return (
          <EmailProcessor
            emails={emails}
            categories={categories}
            onEmailUpdate={handleEmailUpdate}
            onMarkAsProcessed={markAsProcessed}
            onAssignCategory={assignCategory}
          />
        );
      case 'monitoring':
        return (
          <div style={{ padding: tokens.spacingHorizontalL }}>
            <SubscriptionStatus />
            <div style={{ marginTop: tokens.spacingVerticalL }}>
              <CategoryUpdates />
            </div>
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
            <FolderRegular />
            <Text className={styles.logoText}>OLXCatAI</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text size={200} color="neutral">
              AI-Powered Email Categorization
            </Text>
            {isOfficeReady && (
              <Badge appearance="filled" color="success" size="small">
                Outlook Connected
              </Badge>
            )}
            {!isOfficeReady && (
              <Badge appearance="filled" color="warning" size="small">
                Standalone Mode
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.navigation}>
          <div className={styles.navigationTitle}>
            {getTabIcon()} {getTabTitle()}
          </div>
          
          <div className={styles.burgerMenu}>
            <Menu open={isMenuOpen} onOpenChange={(e, data) => setIsMenuOpen(data.open)}>
              <MenuTrigger>
                <MenuButton
                  appearance="transparent"
                  icon={<MoreHorizontalRegular />}
                  aria-label="Navigation menu"
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    className={`${styles.menuItem} ${selectedTab === 'emails' ? styles.activeMenuItem : ''}`}
                    onClick={() => handleTabSelect('emails')}
                  >
                    <HomeRegular className={styles.menuItemIcon} />
                    <Text className={styles.menuItemText}>Emails</Text>
                  </MenuItem>
                  <MenuItem
                    className={`${styles.menuItem} ${selectedTab === 'dashboard' ? styles.activeMenuItem : ''}`}
                    onClick={() => handleTabSelect('dashboard')}
                  >
                    <HomeRegular className={styles.menuItemIcon} />
                    <Text className={styles.menuItemText}>Dashboard</Text>
                  </MenuItem>
                  <MenuItem
                    className={`${styles.menuItem} ${selectedTab === 'categories' ? styles.activeMenuItem : ''}`}
                    onClick={() => handleTabSelect('categories')}
                  >
                    <FolderRegular className={styles.menuItemIcon} />
                    <Text className={styles.menuItemText}>Categories</Text>
                  </MenuItem>
                  <MenuItem
                    className={`${styles.menuItem} ${selectedTab === 'processing' ? styles.activeMenuItem : ''}`}
                    onClick={() => handleTabSelect('processing')}
                  >
                    <PlayRegular className={styles.menuItemIcon} />
                    <Text className={styles.menuItemText}>Email Processing</Text>
                  </MenuItem>
                  <MenuItem
                    className={`${styles.menuItem} ${selectedTab === 'monitoring' ? styles.activeMenuItem : ''}`}
                    onClick={() => handleTabSelect('monitoring')}
                  >
                    <MailRegular className={styles.menuItemIcon} />
                    <Text className={styles.menuItemText}>Email Monitoring</Text>
                  </MenuItem>
                  <MenuItem
                    className={`${styles.menuItem} ${selectedTab === 'settings' ? styles.activeMenuItem : ''}`}
                    onClick={() => handleTabSelect('settings')}
                  >
                    <SettingsRegular className={styles.menuItemIcon} />
                    <Text className={styles.menuItemText}>Settings</Text>
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
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