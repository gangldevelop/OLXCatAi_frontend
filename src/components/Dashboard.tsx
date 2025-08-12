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
import {
  MailRegular,
  FolderRegular,
  CheckmarkRegular,
  TagErrorRegular,
  PlayRegular,
  SettingsRegular,
} from '@fluentui/react-icons';
import { Category, Email, CategoryStats } from '../types';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalM,
    height: '100%',
    minHeight: 0,
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
  },
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
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
    '@media (max-width: 480px)': {
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: tokens.spacingVerticalS,
    },
  },
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
  recentActivity: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    maxHeight: '300px',
    overflowY: 'auto',
  },
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
  onNavigate: (section: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  emails,
  categories,
  onNavigate,
}) => {
  const styles = useStyles();

  const totalEmails = emails.length;
  const processedEmails = emails.filter(email => email.isProcessed).length;
  const unprocessedEmails = totalEmails - processedEmails;
  const categorizedEmails = emails.filter(email => email.categoryId).length;
  const activeCategories = categories.filter(cat => cat.isActive).length;

  const recentEmails = emails
    .slice(0, 5)
    .sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return tokens.colorNeutralForeground3;
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || tokens.colorNeutralForeground3;
  };

  const processingProgress = totalEmails > 0 ? (processedEmails / totalEmails) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Dashboard</h2>
        <Button
          appearance="secondary"
          size="small"
          icon={<SettingsRegular />}
          onClick={() => onNavigate('settings')}
        >
          Settings
        </Button>
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

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <CheckmarkRegular />
            <Text weight="semibold">Processed</Text>
          </div>
          <div className={styles.statValue}>{processedEmails}</div>
          <div className={styles.statDescription}>
            {processingProgress.toFixed(1)}% complete
          </div>
        </div>

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

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FolderRegular />
            <Text weight="semibold">Active Categories</Text>
          </div>
          <div className={styles.statValue}>{activeCategories}</div>
          <div className={styles.statDescription}>Categories available</div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Card
          className={styles.actionCard}
          onClick={() => onNavigate('categories')}
        >
          <CardHeader
            image={<FolderRegular />}
            header={<Text weight="semibold">Manage Categories</Text>}
          />
          <CardPreview>
            <Text size={200} color="neutral">
              Create and organize email categories
            </Text>
          </CardPreview>
        </Card>

        <Card
          className={styles.actionCard}
          onClick={() => onNavigate('processing')}
        >
          <CardHeader
            image={<PlayRegular />}
            header={<Text weight="semibold">Process Emails</Text>}
          />
          <CardPreview>
            <Text size={200} color="neutral">
              {unprocessedEmails > 0
                ? `${unprocessedEmails} emails ready to process`
                : 'All emails processed'}
            </Text>
          </CardPreview>
        </Card>

        {/* <Card
          className={styles.actionCard}
          onClick={() => onNavigate('settings')}
        >
          <CardHeader
            image={<SettingsRegular />}
            header={<Text weight="semibold">Settings</Text>}
          />
          <CardPreview>
            <Text size={200} color="neutral">
              Configure preferences and options
            </Text>
          </CardPreview>
        </Card> */}
      </div>

      <div className={styles.recentActivity}>
        <div className={styles.activityHeader}>
          <Text weight="semibold">Recent Activity</Text>
        </div>
        {recentEmails.length > 0 ? (
          recentEmails.map((email) => (
            <div key={email.id} className={styles.activityItem}>
              <div className={styles.activityContent}>
                <div>
                  <Text weight="semibold" truncate style={{ maxWidth: '300px' }}>
                    {email.subject}
                  </Text>
                  <Text size={200} color="neutral">
                    {email.sender} • {email.receivedDate.toLocaleDateString()}
                  </Text>
                </div>
                <div className={styles.categoryBadge}>
                  <div
                    className={styles.categoryColor}
                    style={{ backgroundColor: getCategoryColor(email.categoryId) }}
                  />
                  <Badge
                    appearance={email.isProcessed ? 'filled' : 'outline'}
                    color={email.isProcessed ? 'success' : 'subtle'}
                    size="small"
                  >
                    {email.isProcessed ? getCategoryName(email.categoryId) : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.activityItem}>
            <Text color="neutral">No recent emails to display</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 