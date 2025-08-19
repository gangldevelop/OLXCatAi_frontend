import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  makeStyles,
  tokens,
  Text,
  Spinner,
  Badge,
  Caption1,
  Subtitle2,
  Title3,
  Button,
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  FolderRegular,
} from '@fluentui/react-icons';
import { categoryService } from '../services/categoryService';
import { Category } from '../types';
import { mapBackendCategoryToCategory } from '../lib/mappers';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  headerContent: {
    flex: 1,
  },
  refreshButton: {
    marginLeft: tokens.spacingHorizontalS,
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  categoryItem: {
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
  },
  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  categoryIcon: {
    fontSize: '20px',
    color: tokens.colorNeutralForeground3,
  },
  categoryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  categoryStats: {
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
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
});

export const CategoryUpdates: React.FC = () => {
  const styles = useStyles();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.list();
      const mappedCategories = data.map(mapBackendCategoryToCategory);
      setCategories(mappedCategories);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
    
    // Poll every 30 seconds for updates
    const interval = setInterval(() => {
      fetchCategories();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && categories.length === 0) {
    return (
      <div className={styles.container}>
        <Card>
          <CardHeader>
            <Title3>Category Updates</Title3>
            <Caption1>Real-time email categorization status</Caption1>
          </CardHeader>
          <div className={styles.loadingContainer}>
            <Spinner size="medium" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <Title3>Category Updates</Title3>
              <Caption1>
                Real-time email categorization status
                {lastUpdated && (
                  <span> • Last updated: {lastUpdated.toLocaleTimeString()}</span>
                )}
              </Caption1>
            </div>
            <Button
              appearance="subtle"
              icon={<ArrowClockwiseRegular />}
              onClick={handleRefresh}
              className={styles.refreshButton}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>

        {error && (
          <div style={{ padding: tokens.spacingHorizontalM }}>
            <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
              Error: {error}
            </Text>
          </div>
        )}

        {categories.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderRegular className={styles.emptyStateIcon} />
            <Subtitle2>No categories found</Subtitle2>
            <Caption1>
              Categories will appear here once email monitoring is active
            </Caption1>
          </div>
        ) : (
          <div className={styles.categoryList}>
            {categories.map((category) => (
              <div key={category.id} className={styles.categoryItem}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <FolderRegular className={styles.categoryIcon} />
                    <div className={styles.categoryDetails}>
                      <Subtitle2>{category.name}</Subtitle2>
                      <Caption1>
                        Keywords: {category.keywords?.join(', ') || 'None'}
                      </Caption1>
                    </div>
                  </div>
                  <div className={styles.categoryStats}>
                    <Badge appearance="filled" color="brand">
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
