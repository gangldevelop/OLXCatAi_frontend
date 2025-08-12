import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Tooltip,
  Badge,
  Switch,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { AddRegular, EditRegular, DeleteRegular, CopyRegular, CheckmarkCircleRegular } from '@fluentui/react-icons';
import { Category } from '../types';
import { AuthStore } from '../stores/auth';
import { notifyError } from '../lib/notify';

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
    marginBottom: tokens.spacingVerticalM,
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  colorPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  colorInput: {
    width: '50px',
    height: '35px',
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
  },
  keywordsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  keywordInput: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  keywordTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase100,
  },
  tableActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  tableContainer: {
    overflow: 'auto',
    maxHeight: '100%',
    '@media (max-width: 600px)': {
      overflowX: 'auto',
      overflowY: 'auto',
    },
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    flexWrap: 'wrap',
  },
  pager: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  responsiveTable: {
    minWidth: '560px',
    '@media (max-width: 480px)': { minWidth: '500px' },
    '@media (max-width: 360px)': { minWidth: '460px' },
  },
  truncatedCell: {
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '120px',
  },
  folderCell: {
    minWidth: '120px',
    maxWidth: '220px',
  },
  keywordsCell: {
    minWidth: '160px',
    maxWidth: '180px',
  },
  statusCell: {
    minWidth: '72px',
    textAlign: 'left',
  },
  actionsCell: { minWidth: '84px', textAlign: 'center' },
  folderValue: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    maxWidth: '100%',
  },
  idText: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: tokens.fontSizeBase100,
  },
  copyBtn: {
    minWidth: '24px',
    padding: 0,
  },
});

interface CategoryManagerProps {
  categories: Category[];
  onCategoryChange: (categories: Category[]) => void;
  onAddCategory?: (category: { name: string; color: string; keywords?: string[]; linkFolder?: boolean }) => void;
  onUpdateCategory?: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory?: (id: string) => void;
  onToggleCategoryActive?: (id: string) => void;
  onImportFromOutlook?: () => Promise<any> | void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCategoryChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryActive,
  onImportFromOutlook,
}) => {
  const styles = useStyles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState('')
  const [debounced, setDebounced] = useState('')
  const [top, setTop] = useState(20)
  const [skip, setSkip] = useState(0)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#0078d4',
    linkFolder: false,
    keywords: [] as string[],
    isActive: true,
  });
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddCategory = () => {
    if (!formData.name || !formData.color) return
    if (formData.linkFolder && !AuthStore.getState().graphToken) {
      notifyError('Outlook authentication required', 'Please re-authenticate Outlook to link a folder.')
      return
    }
    if (onAddCategory) {
      onAddCategory({
        name: formData.name,
        color: formData.color,
        outlookFolderId: null,
        keywords: formData.keywords,
        isActive: formData.isActive,
        linkFolder: formData.linkFolder,
      } as any);
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: formData.name,
        color: formData.color,
        outlookFolderId: null,
        keywords: formData.keywords,
        isActive: formData.isActive,
      };
      onCategoryChange([...categories, newCategory]);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      linkFolder: !!category.outlookFolderId,
      keywords: Array.isArray(category.keywords) ? [...category.keywords] : (category.keywords ? String(category.keywords).split(',').map(s => s.trim()).filter(Boolean) : []),
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    
    if (onUpdateCategory) {
      onUpdateCategory(editingCategory.id, { name: formData.name, color: formData.color, keywords: formData.keywords });
    } else {
      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, ...formData }
          : cat
      );
      onCategoryChange(updatedCategories);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(categoryId);
    } else {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoryChange(updatedCategories);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword),
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#0078d4',
      linkFolder: false,
      keywords: [],
      isActive: true,
    });
    setEditingCategory(null);
    setNewKeyword('');
  };

  const handleDialogOpen = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(filter), 300)
    return () => clearTimeout(t)
  }, [filter])

  const filtered = useMemo(() => {
    const start = skip
    const end = skip + top
    const data = debounced
      ? categories.filter(c => c.name.toLowerCase().includes(debounced.toLowerCase()))
      : categories
    return { total: data.length, page: data.slice(start, end) }
  }, [categories, debounced, skip, top])

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {}
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Email Categories</h2>
        <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="primary" size="small" icon={<AddRegular />} onClick={handleDialogOpen}>
              Add Category
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogContent>
                <div className={styles.form}>
                  <div>
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={formData.name}
                      onChange={(_, data) => setFormData({ ...formData, name: data.value })}
                      placeholder="e.g., Urgent Projects"
                    />
                  </div>
                  
                  <div>
                    <Switch
                      label="Link to Outlook folder"
                      checked={formData.linkFolder}
                      onChange={(_, data) => setFormData({ ...formData, linkFolder: data.checked })}
                    />
                    {formData.linkFolder && !AuthStore.getState().graphToken && (
                      <Text size={200} style={{ color: tokens.colorPaletteRedForeground3 }}>
                        Outlook sign-in required for folder operations
                      </Text>
                    )}
                  </div>

                  <div>
                    <Label>Category Color</Label>
                    <div className={styles.colorPicker}>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                      <span>{formData.color}</span>
                    </div>
                  </div>

                  <div className={styles.keywordsContainer}>
                    <Label>Keywords (Optional)</Label>
                    <div className={styles.keywordInput}>
                      <Input
                        value={newKeyword}
                        onChange={(_, data) => setNewKeyword(data.value)}
                        placeholder="Add keyword"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddKeyword() }}
                      />
                      <Button size="small" onClick={handleAddKeyword}>Add</Button>
                    </div>
                    <div>
                      {formData.keywords.map((keyword: string, index: number) => (
                        <span key={index} className={styles.keywordTag}>
                          {keyword}
                          <Button
                            appearance="subtle"
                            size="small"
                            onClick={() => handleRemoveKeyword(keyword)}
                          >
                            ×
                          </Button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Switch
                      label="Active Category"
                      checked={formData.isActive}
                      onChange={(_, data) => setFormData({ ...formData, isActive: data.checked })}
                    />
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" size="small" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  size="small"
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  disabled={!formData.name || !formData.color || (formData.linkFolder && !AuthStore.getState().graphToken)}
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      <div className={styles.headerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input value={filter} onChange={(_, d) => setFilter(d.value)} placeholder="Search categories" style={{ width: 220 }} />
        </div>
        <div className={styles.pager}>
          {onImportFromOutlook && (
            <Button size="small" onClick={() => onImportFromOutlook?.()} appearance="primary">
              Import from Outlook
            </Button>
          )}
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

      <div className={styles.tableContainer}>
        <Table className={styles.responsiveTable}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell className={styles.categoryCell}>Category</TableHeaderCell>
              <TableHeaderCell className={`${styles.folderCell} hide-on-narrow`}>Folder</TableHeaderCell>
              <TableHeaderCell className={`${styles.keywordsCell} hide-on-narrow`}>Keywords</TableHeaderCell>
            <TableHeaderCell className={styles.statusCell}>Status</TableHeaderCell>
            <TableHeaderCell className={styles.actionsCell}>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.page.map((category) => (
            <TableRow key={category.id}>
              <TableCell className={styles.categoryCell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{ width: 12, height: 12, backgroundColor: category.color, borderRadius: '50%' }} />
                  <span className={styles.truncatedCell} title={category.name}>
                    {category.name}
                  </span>
                    {!category.outlookFolderId && (
                      <Badge appearance="outline" color="brand">Label-only</Badge>
                    )}
                </div>
              </TableCell>
                <TableCell className={`${styles.folderCell} hide-on-narrow`}>
                {category.outlookFolderId ? (
                  <div className={styles.folderValue}>
                    <Tooltip content={category.outlookFolderId} relationship="label">
                      <span className={`${styles.truncatedCell} ${styles.idText}`} title={category.outlookFolderId}>
                        {category.outlookFolderId}
                      </span>
                    </Tooltip>
                    <Tooltip content={copiedId === category.id ? 'Copied' : 'Copy ID'} relationship="description">
                      <Button
                        className={styles.copyBtn}
                        appearance="subtle"
                        icon={copiedId === category.id ? <CheckmarkCircleRegular /> : <CopyRegular />}
                        onClick={() => handleCopy(category.outlookFolderId!, category.id)}
                        aria-label="Copy folder id"
                      />
                    </Tooltip>
                  </div>
                ) : (
                  <Badge appearance="outline" color="brand">Label-only</Badge>
                )}
              </TableCell>
                <TableCell className={`${styles.keywordsCell} hide-on-narrow`}>
                {Array.isArray(category.keywords) && category.keywords.length > 0 ? (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {category.keywords.slice(0, 3).map((kw: string, i: number) => (
                      <Badge key={i} appearance="filled" size="small">
                        <span className={styles.truncatedCell} title={kw}>
                          {kw}
                        </span>
                      </Badge>
                    ))}
                    {category.keywords.length > 3 && (
                      <Badge appearance="filled" size="small">+{category.keywords.length - 3}</Badge>
                    )}
                  </div>
                ) : (
                  <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>
                )}
              </TableCell>
              <TableCell className={styles.statusCell}>
                <Badge
                  appearance={category.isActive ? 'filled' : 'outline'}
                  color={category.isActive ? 'success' : 'subtle'}
                >
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className={styles.actionsCell}>
                <div className={styles.tableActions}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<EditRegular />}
                    aria-label="Edit category"
                    onClick={() => handleEditCategory(category)}
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DeleteRegular />}
                    aria-label="Delete category"
                    onClick={() => handleDeleteCategory(category.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CategoryManager; 