import React, { useRef, useState } from 'react';
import { FiTrash2, FiUpload } from 'react-icons/fi';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { useResource } from '../components/useResource';
import { ConfirmDialog } from '../components/Modal';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../components/ui';
import { formatBytes, formatDateTime } from '../lib/format';

export default function MediaPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useResource('/api/cms/media');
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await api.upload('/api/cms/media', file);
      toast.success('Image uploaded');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/cms/media/${pendingDelete.id}`);
      toast.success('Image deleted');
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
        title="Images"
        description="Floor plans and announcement pictures stored in the object store. Images that are in use cannot be deleted."
        actions={
          <>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={upload} />
            <Button onClick={() => inputRef.current?.click()} loading={uploading}>
              <FiUpload aria-hidden="true" /> Upload image
            </Button>
          </>
        }
      />
      {error && <Alert tone="error" className="mb-4">{error.message}</Alert>}
      {loading && !data ? (
        <div className="flex justify-center py-16"><Spinner className="w-6 h-6 text-primary-600" /></div>
      ) : !data?.length ? (
        <Card><EmptyState title="No images yet" description="Upload a floor plan or a picture for an announcement." /></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <a href={item.url} target="_blank" rel="noreferrer" className="block bg-gray-100 aspect-[4/3]">
                <img src={item.url} alt={item.originalName} className="h-full w-full object-contain" loading="lazy" />
              </a>
              <div className="p-3 text-xs space-y-1 flex-1">
                <p className="font-medium text-gray-900 truncate" title={item.originalName}>{item.originalName || 'Untitled'}</p>
                <p className="text-gray-500">{formatBytes(item.sizeBytes)} · {item.contentType.replace('image/', '').toUpperCase()}</p>
                <p className="text-gray-500">{formatDateTime(item.createdAt)}{item.uploadedBy ? ` · ${item.uploadedBy}` : ''}</p>
                <div className="flex items-center justify-between pt-1">
                  {item.usageCount > 0 ? <Badge tone="green">In use</Badge> : <Badge>Unused</Badge>}
                  <Button
                    variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"
                    disabled={item.usageCount > 0}
                    title={item.usageCount > 0 ? 'Remove it from the announcement or floor first' : 'Delete image'}
                    onClick={() => setPendingDelete(item)}
                    aria-label="Delete image"
                  >
                    <FiTrash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete image?"
        message="The file is removed from storage. This cannot be undone."
        onConfirm={remove}
        onCancel={() => setPendingDelete(null)}
        busy={deleting}
      />
    </>
  );
}
