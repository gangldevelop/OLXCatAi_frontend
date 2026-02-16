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
    padding: tokens.spacingHorizontalXL,
    height: '100%',
    minHeight: 0,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalS, flexWrap: 'wrap', gap: tokens.spacingVerticalS },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: tokens.spacingVerticalM,
    '@media (max-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
    },
    '@media (max-width: 360px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
    },
  },
  monitoringStrip: {
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    padding: '20px 24px',
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  monitoringIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f0f7ff',
    color: '#0f6cbd',
    flexShrink: 0,
  },
  categorySection: {
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    marginBottom: tokens.spacingVerticalM,
    overflow: 'hidden',
  },
  categoryHeader: {
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  categoryHeaderText: {
    fontSize: '15px',
    fontWeight: '600' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
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
    padding: '14px 24px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { backgroundColor: '#f0f7ff' },
  },
  categoryMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  categoryDot: { width: '8px', height: '8px', borderRadius: '50%' },
  categoryName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    color: '#1e293b',
    fontWeight: '500' as any,
  },
  statCard: {
    padding: '20px 16px',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    '@media (max-width: 480px)': {
      padding: '16px 12px',
    },
    '@media (max-width: 360px)': { padding: '14px 10px' },
  },
  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#f0f7ff',
    color: '#0f6cbd',
    margin: '0 auto',
    marginBottom: tokens.spacingVerticalXS,
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: tokens.spacingVerticalXS,
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  statDescription: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  quickActions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: tokens.spacingVerticalM },
  actionCard: {
    padding: tokens.spacingHorizontalM,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    '&:hover': {
      backgroundColor: '#f0f7ff',
      boxShadow: '0 2px 8px rgba(15, 108, 189, 0.12)',
    },
  },
  actionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: tokens.spacingVerticalXS,
  },
  recentActivity: {
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
  },
  activityHeader: {
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
  },
  activityItem: {
    padding: '14px 24px',
    borderBottom: '1px solid #f1f5f9',
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
  manageButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  startMonitoringButton: {
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600' as any,
    background: 'linear-gradient(135deg, #0f6cbd 0%, #2563eb 100%) !important',
    border: 'none !important',
    boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 16px rgba(15, 108, 189, 0.4)',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={styles.monitoringIcon}>
            <MailRegular />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text className={styles.categoryHeaderText}>Email Monitoring</Text>
            <Badge appearance={subscriptions.some(s => s.isActive) ? 'filled' : 'tint'} color={subscriptions.some(s => s.isActive) ? 'success' : 'subtle'} size="small" style={{ fontSize: '11px' }}>
              {subscriptions.some(s => s.isActive) ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        {graphToken && !subscriptions.some(s => s.isActive) && (
          <Button appearance="primary" size="small" className={styles.startMonitoringButton} onClick={() => startEmailMonitoring()} disabled={loading}>
            Start Monitoring
          </Button>
        )}
        {!graphToken && (
          <Text size={200} style={{ color: '#64748b', fontSize: '13px' }}>Sign in to Outlook to enable monitoring</Text>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MailRegular />
          </div>
          <Text className={styles.categoryHeaderText} style={{ marginBottom: 4 }}>Total Emails</Text>
          <div className={styles.statValue}>{totalEmails}</div>
          <div className={styles.statDescription}>Emails in your inbox</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FolderRegular />
          </div>
          <Text className={styles.categoryHeaderText} style={{ marginBottom: 4 }}>Categorized</Text>
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
          <Text className={styles.categoryHeaderText}>Categories</Text>
          <Button size="small" appearance="secondary" className={styles.manageButton} onClick={() => onNavigate('categories')}>Manage</Button>
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