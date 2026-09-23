import React, { useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api } from '../api';
import { useToast } from './Toast';
import { useResource } from './useResource';
import { Modal, ConfirmDialog } from './Modal';
import { Alert, Button, Card, PageHeader, SearchInput, Spinner, Table } from './ui';

// A list + add/edit dialog + delete confirmation for one content type.
//   endpoint    e.g. '/api/cms/faqs'
//   defaults()  form values for a new item
//   fromItem(item) / toPayload(form)   convert between API rows and form values
//   renderForm({ form, update, errors })  the fields
export default function EntityPage({
  title,
  description,
  endpoint,
  itemName,
  columns,
  defaults,
  fromItem = (item) => item,
  toPayload = (form) => form,
  renderForm,
  searchKeys = [],
  modalSize = 'lg',
  headerExtra
}) {
  const toast = useToast();
  const { data, error, loading, reload } = useResource(endpoint);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null); // { id|null, form, errors, saving }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const rows = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((row) => searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(term)));
  }, [data, search, searchKeys]);

  const openCreate = () => setEditor({ id: null, form: defaults(), errors: {}, saving: false });
  const openEdit = (item) => setEditor({ id: item.id, form: fromItem(item), errors: {}, saving: false });
  const closeEditor = () => setEditor(null);

  const update = (field, value) =>
    setEditor((current) => ({
      ...current,
      form: { ...current.form, [field]: value },
      errors: { ...current.errors, [field]: undefined }
    }));

  const save = async (event) => {
    event?.preventDefault();
    if (!editor) return;
    setEditor((current) => ({ ...current, saving: true, errors: {} }));
    try {
      const payload = toPayload(editor.form);
      if (editor.id === null) {
        await api.post(endpoint, payload);
        toast.success(`${capitalise(itemName)} added`);
      } else {
        await api.put(`${endpoint}/${editor.id}`, payload);
        toast.success(`${capitalise(itemName)} updated`);
      }
      setEditor(null);
      reload();
    } catch (err) {
      setEditor((current) => current && { ...current, saving: false, errors: err.errors ?? {}, message: err.message });
      if (!err.errors || !Object.keys(err.errors).length) toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`${endpoint}/${pendingDelete.id}`);
      toast.success(`${capitalise(itemName)} deleted`);
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={openCreate}>
            <FiPlus aria-hidden="true" /> Add {itemName}
          </Button>
        }
      />
      {headerExtra}
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
          {searchKeys.length > 0 ? (
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}…`} className="w-full sm:w-72" />
          ) : <span />}
          <span className="text-xs text-gray-500">
            {loading ? 'Loading…' : `${rows.length} of ${data?.length ?? 0}`}
          </span>
        </div>
        {error && (
          <div className="p-4">
            <Alert tone="error">
              {error.message}{' '}
              <button type="button" className="underline" onClick={reload}>Try again</button>
            </Alert>
          </div>
        )}
        {loading && !data ? (
          <div className="flex justify-center py-12"><Spinner className="w-6 h-6 text-primary-600" /></div>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            emptyMessage={search ? 'No matches for your search.' : `No ${title.toLowerCase()} yet. Add the first one.`}
            actions={(row) => (
              <>
                <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${itemName}`}>
                  <FiEdit2 aria-hidden="true" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setPendingDelete(row)} aria-label={`Delete ${itemName}`}>
                  <FiTrash2 aria-hidden="true" />
                </Button>
              </>
            )}
          />
        )}
      </Card>

      <Modal
        open={Boolean(editor)}
        size={modalSize}
        title={editor?.id === null ? `Add ${itemName}` : `Edit ${itemName}`}
        onClose={editor?.saving ? undefined : closeEditor}
        footer={
          <>
            <Button variant="secondary" onClick={closeEditor} disabled={editor?.saving}>Cancel</Button>
            <Button type="submit" form="entity-form" loading={editor?.saving}>Save</Button>
          </>
        }
      >
        {editor && (
          <form id="entity-form" onSubmit={save} className="space-y-4" noValidate>
            {editor.message && Object.keys(editor.errors).length === 0 && <Alert tone="error">{editor.message}</Alert>}
            {renderForm({ form: editor.form, update, errors: editor.errors })}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${itemName}?`}
        message={`This removes it from the kiosk straight away and cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        busy={deleting}
      />
    </>
  );
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
