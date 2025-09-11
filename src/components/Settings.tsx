import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Switch,
  Label,
  Input,
  Select,
  Option,
  Button,
  makeStyles,
  tokens,
  Text,
  Divider,
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
    padding: tokens.spacingHorizontalM,
    height: '100%',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 480px)': {
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: tokens.spacingHorizontalS,
    },
  },
  settingCard: {
    padding: tokens.spacingHorizontalM,
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  settingDescription: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexWrap: 'wrap',
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
        <SettingsRegular />
        <h2>Settings</h2>
      </div>

      <div className={styles.settingsGrid}>
        <Card className={styles.settingCard}>
          <CardHeader
            image={<LocationRegular />}
            header={<Text weight="semibold">Processing Settings</Text>}
          />
          <CardPreview>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">Auto-Categorize Emails</Text>
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
                <Text weight="semibold">Batch Processing</Text>
                <Text className={styles.settingDescription}>
                  Enable processing multiple emails simultaneously
                </Text>
              </div>
              <Switch
                checked={localSettings.batchProcessing}
                onChange={(_, data) => handleSettingChange('batchProcessing', data.checked)}
              />
            </div>
          </CardPreview>
        </Card>

        <Card className={styles.settingCard}>
          <CardHeader
            image={<LocationRegular />}
            header={<Text weight="semibold">Notification Settings</Text>}
          />
          <CardPreview>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">Email Notifications</Text>
                <Text className={styles.settingDescription}>
                  Receive notifications when emails are categorized
                </Text>
              </div>
              <Switch
                checked={localSettings.notifications}
                onChange={(_, data) => handleSettingChange('notifications', data.checked)}
              />
            </div>
          </CardPreview>
        </Card>

        <Card className={styles.settingCard}>
          <CardHeader
            image={<ShieldRegular />}
            header={<Text weight="semibold">Privacy & Security</Text>}
          />
          <CardPreview>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">Privacy Mode</Text>
                <Text className={styles.settingDescription}>
                  Enhanced privacy protection for sensitive emails
                </Text>
              </div>
              <Switch
                checked={localSettings.privacyMode}
                onChange={(_, data) => handleSettingChange('privacyMode', data.checked)}
              />
            </div>
          </CardPreview>
        </Card>

        {isAdmin && (
          <AdminPresets />
        )}
      </div>

      <div className={styles.actions}>
        <Button
          appearance="secondary"
          icon={<LocationRegular />}
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Reset to Defaults
        </Button>
        <Button
          appearance="primary"
          icon={<SaveRegular />}
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