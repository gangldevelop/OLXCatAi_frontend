import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  ProgressBar,
  Badge,
  Input,
  Dropdown,
  Option,
  Tooltip,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Checkbox,
  makeStyles,
  tokens,
  Text,
  Spinner,
} from '@fluentui/react-components';
import { 
  PlayRegular, 
  PauseRegular, 
  StopRegular, 
  CheckmarkRegular,
  TagErrorRegular,
  MailRegular,
} from '@fluentui/react-icons';
import { Email, Category } from '../types';
import { emailService } from '../services/emailService';
import { recentlyCategorizedStore } from '../stores/recentlyCategorized'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalM,
    height: '100%',
    minHeight: 0,
    overflow: 'auto',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginBottom: tokens.spacingVerticalS,
  },
  pager: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  truncated: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalS,
    '@media (max-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: tokens.spacingHorizontalXS,
    },
  },
  statCard: {
    padding: tokens.spacingHorizontalS,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    textAlign: 'center',
    minHeight: '48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXXS,
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
    flexWrap: 'wrap',
  },
  progressContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
  emailList: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  emailRow: {
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  emailStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
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
  tableContainer: {
    overflow: 'auto',
    maxHeight: '100%',
    '@media (max-width: 600px)': { overflowX: 'auto', overflowY: 'auto' },
  },
  responsiveTable: {
    minWidth: '560px',
    tableLayout: 'fixed',
    '@media (max-width: 480px)': { minWidth: '560px' },
    '@media (max-width: 360px)': { minWidth: '500px' },
  },
  narrowHide: { '@media (max-width: 420px)': { display: 'none' } },
  truncatedCell: {
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  subjectCell: { width: '46%' },
  senderCell: { width: '22%' },
  categoryCell: { width: '18%' },
  dateCell: { width: '14%' },
  statusCell: {
    minWidth: '100px',
    textAlign: 'center',
  },
  checkboxCell: {
    minWidth: '50px',
    textAlign: 'center',
  },
});

interface EmailProcessorProps {
  emails: Email[];
  categories: Category[];
  onEmailUpdate: (emails: Email[]) => void;
  onMarkAsProcessed?: (emailId: string) => void;
  onAssignCategory?: (emailId: string, categoryId: string) => void;
}

type ProcessingStatus = 'idle' | 'processing' | 'paused' | 'completed' | 'error';

const EmailProcessor: React.FC<EmailProcessorProps> = ({
  emails,
  categories,
  onEmailUpdate,
  onMarkAsProcessed,
  onAssignCategory,
}) => {
  const styles = useStyles();
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [filter, setFilter] = useState('')
  const [debounced, setDebounced] = useState('')
  const [top, setTop] = useState(20)
  const [skip, setSkip] = useState(0)
  const [bulkTarget, setBulkTarget] = useState<string | undefined>()

  const unprocessedEmails = emails.filter(email => !email.isProcessed);
  const processedEmails = emails.filter(email => email.isProcessed);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(filter), 300)
    return () => clearTimeout(t)
  }, [filter])

  const filtered = useMemo(() => {
    const data = debounced ? emails.filter(e => e.subject.toLowerCase().includes(debounced.toLowerCase())) : emails
    const start = skip
    const end = skip + top
    return { total: data.length, page: data.slice(start, end) }
  }, [emails, debounced, skip, top])

  const handleSelectAll = () => {
    if (selectedEmails.size === unprocessedEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(unprocessedEmails.map(email => email.id)));
    }
  };

  const handleSelectEmail = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const simulateEmailProcessing = async (email: Email): Promise<Email> => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const category = categories.find(cat => 
      cat.isActive && 
      (((cat.keywords?.some((keyword: string) => 
        email.subject.toLowerCase().includes(keyword.toLowerCase()) ||
        email.body.toLowerCase().includes(keyword.toLowerCase())
      )) ?? false) || Math.random() > 0.7)
    );

    // Use the new hook methods if available
    if (onMarkAsProcessed) {
      onMarkAsProcessed(email.id);
    }
    
    if (onAssignCategory && category?.id) {
      onAssignCategory(email.id, category.id);
    }

    return {
      ...email,
      categoryId: category?.id,
      isProcessed: true,
    };
  };

  const startProcessing = async () => {
    if (selectedEmails.size === 0) return;
    
    setProcessingStatus('processing');
    const emailIds = Array.from(selectedEmails);
    setCurrentIndex(0);
    setProcessedCount(0);
    setErrorCount(0);

    for (let i = 0; i < emailIds.length; i++) {
      if (processingStatus === 'paused') {
        break;
      }
      if (processingStatus === 'error') {
        break;
      }

      const emailId = emailIds[i];
      const email = emails.find(e => e.id === emailId);
      
      if (email) {
        try {
          const updatedEmail = await simulateEmailProcessing(email);
          // If we have the new hook methods, we don't need to call onEmailUpdate
          // as the hooks will handle the state updates
          if (!onMarkAsProcessed || !onAssignCategory) {
            const updatedEmails = emails.map(e => 
              e.id === emailId ? updatedEmail : e
            );
            onEmailUpdate(updatedEmails);
          }
          setProcessedCount(prev => prev + 1);
        } catch (error) {
          setErrorCount(prev => prev + 1);
        }
      }
      
      setCurrentIndex(i + 1);
    }

    setProcessingStatus('completed');
  };

  const pauseProcessing = () => {
    setProcessingStatus('paused');
  };

  const stopProcessing = () => {
    setProcessingStatus('idle');
    setCurrentIndex(0);
  };

  const getStatusIcon = (email: Email) => {
    if (!email.isProcessed) {
      return <MailRegular />;
    }
    if (email.categoryId) {
      return <CheckmarkRegular />;
    }
    return <TagErrorRegular />;
  };

  const getStatusColor = (email: Email) => {
    if (!email.isProcessed) return 'subtle';
    if (email.categoryId) return 'success';
    return 'danger';
  };

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

  const progress = selectedEmails.size > 0 ? (currentIndex / selectedEmails.size) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Email Processing</h2>
      </div>

      <div className={styles.headerBar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input value={filter} onChange={(_, d) => setFilter(d.value)} placeholder="Search subject" style={{ width: 200 }} />
          <Dropdown value={bulkTarget} onOptionSelect={(_, d) => setBulkTarget(d.optionValue as string)} placeholder="Bulk move to" style={{ minWidth: 150 }}>
            {categories.map(c => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Dropdown>
            <Button
            appearance="primary"
              size="small"
            disabled={selectedEmails.size === 0 || !bulkTarget}
            onClick={async () => {
              if (!bulkTarget) return
              const messageIds = Array.from(selectedEmails)
              await emailService.bulkMove({ messageIds, categoryId: bulkTarget })
              recentlyCategorizedStore.mark(messageIds)
              setSelectedEmails(new Set())
              // Reflect changes in parent state so category column updates immediately
              const updatedEmails = emails.map(e => selectedEmails.has(e.id) ? { ...e, categoryId: bulkTarget, isProcessed: true } : e)
              onEmailUpdate(updatedEmails)
            }}
          >
            Bulk Move
          </Button>
        </div>
        <div className={styles.pager}>
          <Button size="small" disabled={skip === 0} onClick={() => setSkip(s => Math.max(0, s - top))}>Previous</Button>
          <Text size={100}>Page {Math.floor(skip / top) + 1}</Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" onClick={() => { setTop(10); setSkip(0) }} appearance={top === 10 ? 'primary' : 'secondary'}>10</Button>
            <Button size="small" onClick={() => { setTop(20); setSkip(0) }} appearance={top === 20 ? 'primary' : 'secondary'}>20</Button>
            <Button size="small" onClick={() => { setTop(50); setSkip(0) }} appearance={top === 50 ? 'primary' : 'secondary'}>50</Button>
          </div>
          <Button size="small" onClick={() => setSkip(s => s + top)}>Next</Button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <Text size={100} weight="semibold">Total</Text>
          <Text size={300}>{emails.length}</Text>
        </div>
        <div className={styles.statCard}>
          <Text size={100} weight="semibold">Unproccessed</Text>
          <Text size={300}>{unprocessedEmails.length}</Text>
        </div>
        <div className={styles.statCard}>
          <Text size={100} weight="semibold">Processed</Text>
          <Text size={300}>{processedEmails.length}</Text>
        </div>
        <div className={styles.statCard}>
          <Text size={100} weight="semibold">Selected</Text>
          <Text size={300}>{selectedEmails.size}</Text>
        </div>
      </div>

      <div className={styles.controls}>
        <Button
          appearance="primary"
          size="small"
          icon={<PlayRegular />}
          onClick={startProcessing}
          disabled={selectedEmails.size === 0 || processingStatus === 'processing'}
        >
          Start Processing
        </Button>
        <Button
          appearance="secondary"
          size="small"
          icon={<PauseRegular />}
          onClick={pauseProcessing}
          disabled={processingStatus !== 'processing'}
        >
          Pause
        </Button>
        <Button
          appearance="secondary"
          size="small"
          icon={<StopRegular />}
          onClick={stopProcessing}
          disabled={processingStatus === 'idle'}
        >
          Stop
        </Button>
      </div>

      {processingStatus !== 'idle' && (
        <div className={styles.progressContainer}>
          <Text weight="semibold" style={{ marginBottom: tokens.spacingVerticalS }}>
            Processing Progress
          </Text>
          <ProgressBar value={progress} />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: tokens.spacingVerticalXS,
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground3,
          }}>
            <span>Processed: {processedCount}</span>
            <span>Errors: {errorCount}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>
      )}

      <div className={styles.emailList}>
        <div className={styles.tableContainer}>
          <Table className={styles.responsiveTable}>
              <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.checkboxCell}>
                  <Checkbox
                    checked={selectedEmails.size === unprocessedEmails.length && unprocessedEmails.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableHeaderCell>
                  <TableHeaderCell className={styles.statusCell}>St</TableHeaderCell>
                  <TableHeaderCell className={styles.subjectCell}>Subject</TableHeaderCell>
              <TableHeaderCell className={`${styles.senderCell} ${styles.narrowHide}`}>Sender</TableHeaderCell>
              <TableHeaderCell className={`${styles.categoryCell} ${styles.narrowHide}`}>Category</TableHeaderCell>
              <TableHeaderCell className={`${styles.dateCell} ${styles.narrowHide}`}>Date</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.page.map((email) => (
                <TableRow key={email.id} className={styles.emailRow}>
                  <TableCell className={styles.checkboxCell}>
                    {!email.isProcessed && (
                      <Checkbox
                        checked={selectedEmails.has(email.id)}
                        onChange={() => handleSelectEmail(email.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell className={styles.statusCell}>
                    <div className={styles.emailStatus}>
                      {getStatusIcon(email)}
                      <Badge
                        appearance="filled"
                        color={getStatusColor(email)}
                        size="small"
                        style={{ fontSize: tokens.fontSizeBase100 }}
                      >
                        {email.isProcessed ? 'Done' : 'New'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className={styles.subjectCell}>
                    <span className={styles.truncatedCell} title={email.subject}>
                      {email.subject}
                    </span>
                  </TableCell>
                  <TableCell className={`${styles.senderCell} ${styles.narrowHide}`}>
                    <span className={styles.truncatedCell} title={email.sender}>
                      {email.sender}
                    </span>
                  </TableCell>
                  <TableCell className={`${styles.categoryCell} ${styles.narrowHide}`}>
                    <div className={styles.categoryBadge}>
                      <div
                        className={styles.categoryColor}
                        style={{ backgroundColor: getCategoryColor(email.categoryId, email.parentFolderId) }}
                      />
                      <span className={styles.truncatedCell} title={getCategoryName(email.categoryId)}>
                        {getCategoryName(email.categoryId, email.parentFolderId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={`${styles.dateCell} ${styles.narrowHide}`}>
                    <span style={{ fontSize: tokens.fontSizeBase100 }}>
                      {email.receivedDate.toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default EmailProcessor; 