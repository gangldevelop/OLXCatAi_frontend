import React from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Badge,
  makeStyles,
  tokens,
  Text,
  Spinner,
} from '@fluentui/react-components';
import { MailRegular, FolderRegular, CheckmarkRegular, PlayRegular } from '@fluentui/react-icons';
import RecentlyCategorized from './RecentlyCategorized'
import { Category, Email, CategoryStats } from '../types';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { AuthStore } from '../stores/auth';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalM,
    height: '100%',
    minHeight: 0,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalS, flexWrap: 'wrap', gap: tokens.spacingVerticalS },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalM,
    '@media (max-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: tokens.spacingHorizontalXS,
    },
    '@media (max-width: 360px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    }
  },
  monitoringStrip: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  categorySection: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    marginBottom: tokens.spacingVerticalM,
    overflow: 'hidden',
  },
  categoryHeader: {
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { backgroundColor: tokens.colorNeutralBackground2 },
  },
  categoryMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  categoryDot: { width: '8px', height: '8px', borderRadius: '50%' },
  categoryName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statCard: {
    padding: tokens.spacingHorizontalS,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    textAlign: 'center',
    '@media (max-width: 480px)': {
      padding: tokens.spacingHorizontalS,
    },
    '@media (max-width: 360px)': { padding: tokens.spacingHorizontalXS },
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  statDescription: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  quickActions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalM },
  actionCard: {
    padding: tokens.spacingHorizontalM,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  actionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  recentActivity: { border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, overflow: 'hidden' },
  activityHeader: {
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    position: 'sticky',
    top: 0,
  },
  activityItem: {
    padding: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  activityContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  categoryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0,
  },
  categoryColor: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
});

interface DashboardProps {
  emails: Email[];
  categories: Category[];
  onNavigate: (section: string, options?: { filterCategoryId?: string; filterFolderId?: string }) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  emails,
  categories,
  onNavigate,
}) => {
  const styles = useStyles();
  const { subscriptions, loading, startEmailMonitoring } = useSubscriptions();
  const { graphToken } = AuthStore.getState();

  const totalEmails = emails.length;
  const processedEmails = emails.filter(email => email.isProcessed).length;
  const unprocessedEmails = totalEmails - processedEmails;
  const categorizedEmails = emails.filter(email => email.categoryId).length;
  const activeCategories = categories.filter(cat => cat.isActive).length;

  const recentEmails = emails
    .slice(0, 5)
    .sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());

  const getCategoryName = (categoryId?: string, parentFolderId?: string) => {
    let category = categoryId ? categories.find(cat => cat.id === categoryId) : undefined
    if (!category && parentFolderId) {
      category = categories.find(cat => cat.outlookFolderId === parentFolderId)
    }
    if (!category) return 'Uncategorized'
    return category.name
  };

  const getCategoryColor = (categoryId?: string, parentFolderId?: string) => {
    let category = categoryId ? categories.find(cat => cat.id === categoryId) : undefined
    if (!category && parentFolderId) {
      category = categories.find(cat => cat.outlookFolderId === parentFolderId)
    }
    return category?.color || tokens.colorNeutralForeground3
  };

  const processingProgress = totalEmails > 0 ? (processedEmails / totalEmails) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.monitoringStrip}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MailRegular />
          <Text weight="semibold">Email Monitoring</Text>
          <Badge appearance={subscriptions.some(s => s.isActive) ? 'filled' : 'tint'} color={subscriptions.some(s => s.isActive) ? 'success' : 'subtle'} size="small" style={{ fontSize: tokens.fontSizeBase100 }}>
            {subscriptions.some(s => s.isActive) ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {graphToken && !subscriptions.some(s => s.isActive) && (
          <Button appearance="primary" size="small" onClick={() => startEmailMonitoring()} disabled={loading}>
            Start Monitoring
          </Button>
        )}
        {!graphToken && (
          <Text size={200} color="neutral">Sign in to Outlook to enable monitoring</Text>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <MailRegular />
            <Text weight="semibold">Total Emails</Text>
          </div>
          <div className={styles.statValue}>{totalEmails}</div>
          <div className={styles.statDescription}>Emails in your inbox</div>
        </div>

        {/* <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <CheckmarkRegular />
            <Text weight="semibold">Processed</Text>
          </div>
          <div className={styles.statValue}>{processedEmails}</div>
          <div className={styles.statDescription}>
            {processingProgress.toFixed(1)}% complete
          </div>
        </div> */}

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FolderRegular />
            <Text weight="semibold">Categorized</Text>
          </div>
          <div className={styles.statValue}>{categorizedEmails}</div>
          <div className={styles.statDescription}>
            Emails organized into folders
          </div>
        </div>

        {/* <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FolderRegular />
            <Text weight="semibold">Active Categories</Text>
          </div>
          <div className={styles.statValue}>{activeCategories}</div>
          <div className={styles.statDescription}>Categories available</div>
        </div> */}
      </div>

      <div className={styles.categorySection}>
        <div className={styles.categoryHeader}>
          <Text weight="semibold">Categories</Text>
          <Button size="small" appearance="secondary" onClick={() => onNavigate('categories')}>Manage</Button>
        </div>
        <div className={styles.categoryList}>
          {categories.map(cat => {
            const count = emails.filter(e => e.categoryId === cat.id || e.parentFolderId === cat.outlookFolderId).length;
            return (
              <div
                key={cat.id}
                className={styles.categoryItem}
                onClick={() => onNavigate('emails', { filterCategoryId: cat.id, filterFolderId: (cat as any).outlookFolderId || undefined })}
              >
                <div className={styles.categoryMeta}>
                  <div className={styles.categoryDot} style={{ backgroundColor: cat.color || tokens.colorNeutralForeground3 }} />
                  <span className={styles.categoryName} title={cat.name}>{cat.name}</span>
                </div>
                <Badge appearance="filled" size="small">{count}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions removed as processing is handled in Emails tab */}

      <RecentlyCategorized
        emails={emails}
        categories={categories}
        onEmailUpdated={(id, updates) => {
          const existing = emails.find(e => e.id === id)
          if (!existing) return
          existing && (existing.categoryId !== updates.categoryId || existing.isProcessed !== updates.isProcessed) && (void 0)
        }}
      />
    </div>
  );
};

export default Dashboard; 