import React, { useEffect, useState } from 'react';
import {
  Switch,
  Button,
  makeStyles,
  tokens,
  Text,
} from '@fluentui/react-components';
import { 
  SettingsRegular, 
  ShieldRegular, 
  LocationRegular,
  SaveRegular,
  KeyResetRegular,
} from '@fluentui/react-icons';
import { UserSettings } from '../types';
import AdminPresets from './AdminPresets'
import { adminService } from '../services/adminService'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalXL,
    height: '100%',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: tokens.spacingVerticalM,
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0f6cbd 0%, #3b82f6 100%)',
    color: '#ffffff',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    margin: 0,
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
      gap: '14px',
    },
  },
  settingCard: {
    padding: '20px 24px',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: '1px solid #f1f5f9',
  },
  cardHeaderIcon: {
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
  cardHeaderText: {
    fontSize: '15px',
    fontWeight: '600' as any,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #f1f5f9',
    gap: '12px',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  settingTitle: {
    fontSize: '13px',
    fontWeight: '600' as any,
    color: '#1e293b',
    lineHeight: '1.3',
  },
  settingDescription: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalM,
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  primaryButton: {
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600' as any,
    background: 'linear-gradient(135deg, #0f6cbd 0%, #2563eb 100%) !important',
    border: 'none !important',
    boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
    transition: 'all 0.2s ease',
    ':hover:not(:disabled)': {
      boxShadow: '0 4px 16px rgba(15, 108, 189, 0.4)',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onToggleSetting?: (key: keyof UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange, onToggleSetting }) => {
  const styles = useStyles();
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [probing, setProbing] = useState<boolean>(false)

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const defaultSettings: UserSettings = {
    autoCategorize: true,
    notifications: true,
    batchProcessing: false,
    privacyMode: false,
  };

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setProbing(true)
      try {
        const ok = await adminService.probeAccess()
        if (mounted) setIsAdmin(!!ok)
      } catch {
        if (mounted) setIsAdmin(false)
      } finally {
        if (mounted) setProbing(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <SettingsRegular />
        </div>
        <h2 className={styles.headerTitle}>Settings</h2>
      </div>

      <div className={styles.settingsGrid}>
        <div className={styles.settingCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}>
              <LocationRegular />
            </div>
            <Text className={styles.cardHeaderText}>Processing Settings</Text>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text className={styles.settingTitle}>Auto-Categorize Emails</Text>
              <Text className={styles.settingDescription}>
                Automatically categorize incoming emails using AI
              </Text>
            </div>
            <Switch
              checked={localSettings.autoCategorize}
              onChange={(_, data) => handleSettingChange('autoCategorize', data.checked)}
            />
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text className={styles.settingTitle}>Batch Processing</Text>
              <Text className={styles.settingDescription}>
                Enable processing multiple emails simultaneously
              </Text>
            </div>
            <Switch
              checked={localSettings.batchProcessing}
              onChange={(_, data) => handleSettingChange('batchProcessing', data.checked)}
            />
          </div>
        </div>

        <div className={styles.settingCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}>
              <LocationRegular />
            </div>
            <Text className={styles.cardHeaderText}>Notification Settings</Text>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text className={styles.settingTitle}>Email Notifications</Text>
              <Text className={styles.settingDescription}>
                Receive notifications when emails are categorized
              </Text>
            </div>
            <Switch
              checked={localSettings.notifications}
              onChange={(_, data) => handleSettingChange('notifications', data.checked)}
            />
          </div>
        </div>

        <div className={styles.settingCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}>
              <ShieldRegular />
            </div>
            <Text className={styles.cardHeaderText}>Privacy & Security</Text>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <Text className={styles.settingTitle}>Privacy Mode</Text>
              <Text className={styles.settingDescription}>
                Enhanced privacy protection for sensitive emails
              </Text>
            </div>
            <Switch
              checked={localSettings.privacyMode}
              onChange={(_, data) => handleSettingChange('privacyMode', data.checked)}
            />
          </div>
        </div>

        {isAdmin && (
          <AdminPresets />
        )}
      </div>

      <div className={styles.actions}>
        <Button
          appearance="secondary"
          icon={<KeyResetRegular />}
          className={styles.secondaryButton}
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Reset to Defaults
        </Button>
        <Button
          appearance="primary"
          icon={<SaveRegular />}
          className={styles.primaryButton}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Settings; 