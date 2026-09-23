import React, { useRef, useState } from 'react';
import { FiImage, FiTrash2, FiUpload } from 'react-icons/fi';
import { api } from '../api';
import { Button, cx } from './ui';

// value: { id, url } | null. Uploads straight to the media library and reports the
// stored id back to the parent form.
export function ImageUpload({ value, onChange, label = 'Image', hint, previewClassName = 'h-40' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const media = await api.upload('/api/cms/media', file);
      onChange({ id: media.id, url: media.url });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <div
        className={cx(
          'relative flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden',
          previewClassName
        )}
      >
        {value?.url ? (
          <img src={value.url} alt="" className="h-full w-full object-contain" />
        ) : (
          <div className="text-center text-gray-400">
            <FiImage className="mx-auto h-8 w-8" aria-hidden="true" />
            <p className="text-xs mt-1">No image</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFile} />
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} loading={uploading}>
          <FiUpload aria-hidden="true" /> {value ? 'Replace' : 'Upload'}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} disabled={uploading}>
            <FiTrash2 aria-hidden="true" /> Remove
          </Button>
        )}
      </div>
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
