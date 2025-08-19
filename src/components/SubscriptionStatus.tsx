import React from 'react';
import {
  Card,
  CardHeader,
  Button,
  Badge,
  makeStyles,
  tokens,
  Text,
  Spinner,
  MessageBar,
  Divider,
  Caption1,
  Body1,
  Subtitle2,
  Title3,
} from '@fluentui/react-components';
import {
  MailRegular,
  PlayRegular,
  DeleteRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { AuthStore } from '../stores/auth';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
  },
  headerContent: {
    flex: 1,
  },
  subscriptionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  subscriptionItem: {
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  subscriptionItemActive: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  subscriptionItemInactive: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  subscriptionContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  statusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusIndicatorActive: {
    backgroundColor: tokens.colorNeutralForeground2,
  },
  statusIndicatorInactive: {
    backgroundColor: tokens.colorNeutralForeground3,
  },
  subscriptionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  subscriptionActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  emptyStateIcon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalM,
  },
  warningMessage: {
    marginTop: tokens.spacingVerticalM,
  },
});

export const SubscriptionStatus: React.FC = () => {
  const styles = useStyles();
  const { 
    subscriptions, 
    loading, 
    error, 
    startEmailMonitoring, 
    deleteSubscription,
    fetchSubscriptions 
  } = useSubscriptions();
  const { graphToken } = AuthStore.getState();

  const handleStartMonitoring = async () => {
    try {
      await startEmailMonitoring();
      // Refresh the list after creating
      fetchSubscriptions();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await deleteSubscription(id);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const hasActiveSubscription = subscriptions.some(sub => sub.isActive);
  const canStartMonitoring = !!graphToken && !hasActiveSubscription;
  

  if (loading) {
    return (
      <div className={styles.container}>
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Spinner size="small" />
              <Text>Loading subscriptions...</Text>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <MessageBar intent="error">
          <Text>Error loading subscriptions: {error}</Text>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={<Title3>Email Monitoring Status</Title3>}
          description={<Caption1>Monitor your inbox for new emails and automatic categorization</Caption1>}
          action={canStartMonitoring ? (
            <Button appearance="primary" icon={<PlayRegular />} onClick={handleStartMonitoring}>
              Start Email Monitoring
            </Button>
          ) : null}
        />

        {subscriptions.length === 0 ? (
          <div className={styles.emptyState}>
            <MailRegular className={styles.emptyStateIcon} />
            <Subtitle2>No monitoring subscriptions</Subtitle2>
            <Body1>
              {canStartMonitoring 
                ? 'Get started by clicking the button above to begin monitoring your inbox.'
                : 'Please authenticate with Outlook to start email monitoring.'
              }
            </Body1>
          </div>
        ) : (
          <div className={styles.subscriptionList}>
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className={`${styles.subscriptionItem} ${
                  subscription.isActive 
                    ? styles.subscriptionItemActive 
                    : styles.subscriptionItemInactive
                }`}
              >
                <div className={styles.subscriptionContent}>
                  <div className={styles.subscriptionInfo}>
                    <div className={`${styles.statusIndicator} ${
                      subscription.isActive 
                        ? styles.statusIndicatorActive 
                        : styles.statusIndicatorInactive
                    }`} />
                    <div className={styles.subscriptionDetails}>
                      <Subtitle2>
                        {subscription.isActive ? 'Active' : 'Inactive'} Monitoring
                      </Subtitle2>
                      <Caption1>
                        Resource: {subscription.resource}
                      </Caption1>
                      <Caption1>
                        Expires: {new Date(subscription.expirationDateTime).toLocaleDateString()}
                      </Caption1>
                    </div>
                  </div>
                  <div className={styles.subscriptionActions}>
                    <Badge 
                      appearance={subscription.isActive ? 'filled' : 'tint'}
                      color={subscription.isActive ? 'success' : 'subtle'}
                    >
                      {subscription.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      onClick={() => handleDeleteSubscription(subscription.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!graphToken && (
          <div className={styles.warningMessage}>
            <Divider />
            <MessageBar intent="warning" icon={<WarningRegular />}>
              <Text>Outlook authentication required</Text>
              <br />
              <Caption1>You need to authenticate with Outlook to start email monitoring.</Caption1>
            </MessageBar>
          </div>
        )}
        

      </Card>
    </div>
  );
};
