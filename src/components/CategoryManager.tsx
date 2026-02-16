import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Label,
  Dialog,
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
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuButton,
  Badge,
  Switch,
  Text,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { AddRegular, EditRegular, DeleteRegular, ArrowLeftRegular } from '@fluentui/react-icons';
import { Category } from '../types';
import { AuthStore } from '../stores/auth';
import { notifyError, notifySuccess } from '../lib/notify';
import { adminService } from '../services/adminService'
import { ORGANIZATION_ID } from '../config/env'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalXL,
    height: '100%',
    minHeight: 0,
    overflow: 'auto',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalS,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
    flex: 1,
  },
  backButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
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
  addButton: {
    borderRadius: '10px',
    minWidth: '32px',
    padding: '6px',
    background: 'linear-gradient(135deg, #0f6cbd 0%, #2563eb 100%) !important',
    border: 'none !important',
    boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
    transition: 'all 0.2s ease',
    ':hover:not(:disabled)': {
      boxShadow: '0 4px 16px rgba(15, 108, 189, 0.4)',
      transform: 'translateY(-1px)',
    },
    ':active': { transform: 'translateY(0)' },
  },
  dialogSurface: {
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600' as any,
    color: '#0f172a',
  },
  formInput: {
    borderRadius: '10px',
    '& input': { fontSize: '13px' },
  },
  colorPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  colorInput: {
    width: '50px',
    height: '36px',
    border: '1px solid #f1f5f9',
    borderRadius: '10px',
    cursor: 'pointer',
    padding: '2px',
  },
  keywordsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  keywordInput: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  keywordTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#f0f7ff',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#1e293b',
  },
  primaryButton: {
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600' as any,
    background: 'linear-gradient(135deg, #0f6cbd 0%, #2563eb 100%) !important',
    border: 'none !important',
    boxShadow: '0 2px 8px rgba(15, 108, 189, 0.3)',
    ':hover:not(:disabled)': {
      boxShadow: '0 4px 16px rgba(15, 108, 189, 0.4)',
      transform: 'translateY(-1px)',
    },
    ':active': { transform: 'translateY(0)' },
  },
  secondaryButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  tableActions: {
    display: 'flex',
    gap: '4px',
  },
  tableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '100%',
    maxWidth: '100%',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
  },
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '140px',
    borderRadius: '10px',
    '& input': { fontSize: '13px' },
  },
  pager: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pagerText: {
    fontSize: '13px',
    color: '#64748b',
  },
  actionsButton: {
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600' as any,
  },
  responsiveTable: {
    minWidth: '280px',
    width: '100%',
    tableLayout: 'fixed',
  },
  narrowHide: { '@media (max-width: 280px)': { display: 'none' } },
  truncatedCell: {
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    color: '#1e293b',
  },
  keywordText: {
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '80px',
    overflow: 'hidden',
  },
  keywordsCell: {
    minWidth: '70px',
    maxWidth: '90px',
    overflow: 'hidden',
  },
  statusCell: {
    minWidth: '52px',
    width: '52px',
    textAlign: 'left',
  },
  actionsCell: { minWidth: '68px', width: '68px', textAlign: 'center' },
  tableHeader: {
    fontSize: '12px',
    fontWeight: '600' as any,
    color: '#64748b',
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
    ':hover': { backgroundColor: '#f0f7ff' },
  },
  confirmDialogSurface: {
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
});

interface CategoryManagerProps {
  categories: Category[];
  onCategoryChange: (categories: Category[]) => void;
  onAddCategory?: (category: { name: string; color: string; keywords?: string[]; linkFolder?: boolean }) => void;
  onUpdateCategory?: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory?: (id: string) => void | Promise<void>;
  onToggleCategoryActive?: (id: string) => void;
  onImportFromOutlook?: () => Promise<any> | void;
  onBack?: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCategoryChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryActive,
  onImportFromOutlook,
  onBack,
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [lockPreset, setLockPreset] = useState<boolean>(false)
  const [probingAdmin, setProbingAdmin] = useState<boolean>(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleteInProgress, setDeleteInProgress] = useState(false)

  const handleAddCategory = async () => {
    if (!formData.name || !formData.color) return
    if (formData.linkFolder && !AuthStore.getState().graphToken) {
      notifyError('Outlook authentication required', 'Please re-authenticate Outlook to link a folder.')
      return
    }
    const name = formData.name
    try {
      if (onAddCategory) {
        await onAddCategory({
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
      notifySuccess('Category added', `${name} has been created.`);
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 409 || /exists/i.test(e?.message || '')) {
        notifyError('This category name already exists.')
      } else {
        notifyError('Failed to create category')
      }
    }
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

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const name = formData.name
    try {
      if (onUpdateCategory) {
        await onUpdateCategory(editingCategory.id, { name: formData.name, color: formData.color, keywords: formData.keywords });
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
      notifySuccess('Category updated', `${name} has been saved.`);
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 409 && /locked preset/i.test(e?.message || '')) {
        notifyError('This category is locked by an admin preset.')
      } else if (status === 409) {
        notifyError('A category with this name already exists.')
      } else {
        notifyError('Failed to update category')
      }
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const name = categoryToDelete.name;
    setDeleteInProgress(true);
    try {
      if (onDeleteCategory) {
        await onDeleteCategory(categoryToDelete.id);
      } else {
        const updatedCategories = categories.filter(cat => cat.id !== categoryToDelete.id);
        onCategoryChange(updatedCategories);
      }
      setCategoryToDelete(null);
      notifySuccess('Category deleted', `${name} has been removed.`);
    } catch (e: any) {
      notifyError('Failed to delete category', e?.message);
    } finally {
      setDeleteInProgress(false);
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
    let mounted = true
    const probe = async () => {
      setProbingAdmin(true)
      try {
        const ok = await adminService.probeAccess()
        if (mounted) setIsAdmin(!!ok)
      } catch {
        if (mounted) setIsAdmin(false)
      } finally {
        if (mounted) setProbingAdmin(false)
      }
    }
    probe()
    return () => { mounted = false }
  }, [])

  const handleCreatePreset = async () => {
    try {
      const body = {
        organizationId: ORGANIZATION_ID,
        name: formData.name,
        color: formData.color,
        keywords: (Array.isArray(formData.keywords) ? formData.keywords.join(',') : undefined) as string | undefined,
        isDefault: true,
        locked: !!lockPreset,
      }
      await adminService.createPreset(body as any)
      notifySuccess('Preset created.')
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 403) {
        setIsAdmin(false)
        return
      }
      if (status === 409 || status === 500) {
        notifyError('Preset already exists.')
        return
      }
      notifyError('Failed to create preset')
    }
  }

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

  

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {onBack && (
            <Button
              appearance="secondary"
              size="small"
              className={styles.backButton}
              icon={<ArrowLeftRegular />}
              onClick={onBack}
            >
              Back
            </Button>
          )}
          <h2 className={styles.headerTitle}>Email Categories</h2>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
          <DialogSurface className={styles.dialogSurface}>
            <DialogBody>
              <DialogTitle style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogContent>
                <div className={styles.form}>
                  <div>
                    <Label htmlFor="categoryName" className={styles.formLabel}>Category Name</Label>
                    <Input
                      id="categoryName"
                      className={styles.formInput}
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

                  {isAdmin && (
                    <div style={{ marginTop: tokens.spacingVerticalM, paddingTop: tokens.spacingVerticalS, borderTop: '1px solid #f1f5f9' }}>
                      <Label className={styles.formLabel}>Admin actions</Label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, marginTop: 6 }}>
                        <Button size="small" appearance="secondary" className={styles.secondaryButton} onClick={handleCreatePreset} disabled={!formData.name || probingAdmin}>
                          Create company preset from this category
                        </Button>
                        <Switch label="Locked" checked={lockPreset} onChange={(_, d) => setLockPreset(d.checked)} />
                      </div>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Company preset: matches by name; locked blocks name/color/keywords edits.
                      </Text>
                    </div>
                  )}

                  <div>
                    <Label className={styles.formLabel}>Category Color</Label>
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
                    <Label className={styles.formLabel}>Keywords (Optional)</Label>
                    <div className={styles.keywordInput}>
                      <Input
                        className={styles.formInput}
                        value={newKeyword}
                        onChange={(_, data) => setNewKeyword(data.value)}
                        placeholder="Add keyword"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddKeyword() }}
                      />
                      <Button size="small" className={styles.secondaryButton} onClick={handleAddKeyword}>Add</Button>
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
                <Button appearance="secondary" size="small" className={styles.secondaryButton} onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  size="small"
                  className={styles.primaryButton}
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  disabled={!formData.name || !formData.color || (formData.linkFolder && !AuthStore.getState().graphToken)}
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
      </Dialog>

      <div className={styles.controlsBar}>
        <Input value={filter} onChange={(_, d) => setFilter(d.value)} placeholder="Search categories" className={styles.searchInput} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button appearance="primary" size="small" icon={<AddRegular />} aria-label="Add category" className={styles.addButton} onClick={handleDialogOpen} />
          <Menu>
            <MenuTrigger>
              <MenuButton size="small" appearance="secondary" className={styles.actionsButton}>Actions</MenuButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {onImportFromOutlook && (
                  <MenuItem onClick={() => onImportFromOutlook?.()}>Sync from Outlook</MenuItem>
                )}
                <MenuDivider />
                <MenuItem disabled>Page {Math.floor(skip / top) + 1} of {Math.max(1, Math.ceil(filtered.total / top))}</MenuItem>
                <MenuItem disabled>Total: {filtered.total}</MenuItem>
                <MenuItem onClick={() => setSkip(s => Math.max(0, s - top))} disabled={skip === 0}>Previous Page</MenuItem>
                <MenuItem onClick={() => setSkip(s => s + top)} disabled={skip + top >= filtered.total}>Next Page</MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => { setTop(10); setSkip(0); }}>10 / page</MenuItem>
                <MenuItem onClick={() => { setTop(20); setSkip(0); }}>20 / page</MenuItem>
                <MenuItem onClick={() => { setTop(50); setSkip(0); }}>50 / page</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <Table className={styles.responsiveTable}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell className={`${styles.categoryCell} ${styles.tableHeader}`}>Category</TableHeaderCell>
            <TableHeaderCell className={`${styles.keywordsCell} ${styles.narrowHide} ${styles.tableHeader}`}>Keywords</TableHeaderCell>
            <TableHeaderCell className={`${styles.statusCell} ${styles.tableHeader}`}>Status</TableHeaderCell>
            <TableHeaderCell className={`${styles.actionsCell} ${styles.tableHeader}`}>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.page.map((category) => (
            <TableRow key={category.id} className={styles.tableRow}>
              <TableCell className={styles.categoryCell}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 12, height: 12, minWidth: 12, minHeight: 12, flexShrink: 0, backgroundColor: category.color, borderRadius: '50%' }} />
                  <span className={styles.truncatedCell} title={category.name}>
                    {category.name}
                  </span>
                    {!category.outlookFolderId && (
                      <Badge appearance="outline" color="brand" size="small" style={{ fontSize: tokens.fontSizeBase100 }}>Label-only</Badge>
                    )}
                </div>
              </TableCell>
              
                <TableCell className={`${styles.keywordsCell} ${styles.narrowHide}`}>
                {Array.isArray(category.keywords) && category.keywords.length > 0 ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }}>
                    {category.keywords.slice(0, 1).map((kw: string, i: number) => (
                      <Badge key={i} appearance="filled" size="small" style={{ fontSize: tokens.fontSizeBase100, maxWidth: 120 }}>
                        <span className={styles.keywordText} title={kw}>{kw}</span>
                      </Badge>
                    ))}
                    {category.keywords.length > 1 && (
                      <Badge appearance="filled" size="small" style={{ fontSize: tokens.fontSizeBase100 }}>+{category.keywords.length - 1}</Badge>
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
                  size="small"
                  style={{ fontSize: tokens.fontSizeBase100 }}
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
                    onClick={() => handleDeleteClick(category)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>

      <Dialog open={!!categoryToDelete} onOpenChange={(_, d) => !d.open && setCategoryToDelete(null)}>
        <DialogSurface className={styles.confirmDialogSurface}>
          <DialogBody>
            <DialogTitle style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
              Delete Category
            </DialogTitle>
            <DialogContent>
              <Text style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: '#1e293b' }}>{categoryToDelete?.name}</strong>? This action cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                size="small"
                className={styles.secondaryButton}
                onClick={() => setCategoryToDelete(null)}
                disabled={deleteInProgress}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                size="small"
                className={styles.primaryButton}
                onClick={handleConfirmDelete}
                disabled={deleteInProgress}
              >
                {deleteInProgress ? (
                  <>
                    <Spinner size="tiny" />
                    <span style={{ marginLeft: 8 }}>Deleting…</span>
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default CategoryManager; 