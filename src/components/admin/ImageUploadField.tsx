import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** file input accept attribute, e.g. "image/*" */
  accept?: string;
  hint?: string;
  /** preview shape: "square" for avatars, "wide" for backgrounds */
  preview?: 'square' | 'wide';
  placeholder?: string;
}

/**
 * Reusable media field: live preview + upload from disk + manual URL entry.
 * Uploads go through POST /api/upload (auth) and return a /uploads/... URL.
 */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon',
  hint,
  preview = 'wide',
  placeholder = 'https://... 或上传文件',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(undefined);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > 8 * 1024 * 1024) {
      setError('文件超过 8MB，请压缩后再上传');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsDataURL(file);
      });
      // local preview even before the request finishes
      setPreviewSrc(dataUrl);
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ name: file.name, data: dataUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(j.error || `上传失败 (${res.status})`);
      }
      const j = await res.json();
      onChange(j.url);
    } catch (e: any) {
      setError(e.message || '上传失败');
      setPreviewSrc(undefined);
    } finally {
      setUploading(false);
    }
  };

  const shownSrc = previewSrc || value;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-primary">{label}</label>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div
          className={
            preview === 'square'
              ? 'w-20 h-20 shrink-0 rounded-xl border border-border bg-bg-base overflow-hidden flex items-center justify-center'
              : 'w-36 h-20 shrink-0 rounded-xl border border-border bg-bg-base overflow-hidden flex items-center justify-center'
          }
        >
          {shownSrc ? (
            <img
              src={shownSrc}
              alt={label}
              className="w-full h-full object-cover"
              onError={() => setPreviewSrc('')}
              referrerPolicy="no-referrer"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value || ''}
              onChange={e => {
                setPreviewSrc(undefined);
                onChange(e.target.value);
              }}
              placeholder={placeholder}
              className="flex-1 min-w-0 px-3 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 shrink-0 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
              title="从本地上传"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              上传
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  setPreviewSrc(undefined);
                  onChange('');
                }}
                className="p-2 shrink-0 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                title="清空"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {hint && <p className="text-xs text-text-muted">{hint}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
};
