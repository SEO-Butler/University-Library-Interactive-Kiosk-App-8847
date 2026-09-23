import React from 'react';
import QRCode from 'react-qr-code';
import EntityPage from '../components/EntityPage';
import { useResource } from '../components/useResource';
import { Badge, Field, Input, TextArea, Toggle } from '../components/ui';

function isHttps(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default function QrLinksPage() {
  const { data: meta } = useResource('/api/cms/meta');
  const allowed = meta?.qrAllowedHosts?.length ? meta.qrAllowedHosts.join(', ') : 'any https:// site';

  return (
    <EntityPage
      title="QR links"
      description="Services visitors can open on their phone by scanning a code on the Quick Links screen."
      endpoint="/api/cms/qr-links"
      itemName="QR link"
      searchKeys={['name', 'url', 'description']}
      headerExtra={null}
      columns={[
        {
          key: 'name', label: 'Service',
          render: (row) => (
            <div className="flex items-start gap-3">
              <div className="bg-white p-1 rounded border border-gray-200 flex-shrink-0">
                <QRCode value={row.url} size={40} level="M" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{row.name}</p>
                <p className="text-gray-500">{row.description}</p>
                <p className="text-xs text-primary-700 break-all">{row.url}</p>
              </div>
            </div>
          )
        },
        { key: 'sortOrder', label: 'Order', className: 'text-gray-500' },
        { key: 'published', label: 'Status', render: (row) => (row.published ? <Badge tone="green">Live</Badge> : <Badge>Hidden</Badge>) }
      ]}
      defaults={() => ({ name: '', url: 'https://', description: '', sortOrder: 0, published: true })}
      fromItem={(item) => ({ name: item.name, url: item.url, description: item.description, sortOrder: item.sortOrder, published: item.published })}
      toPayload={(form) => ({ ...form, sortOrder: Number(form.sortOrder) || 0 })}
      renderForm={({ form, update, errors }) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Name" htmlFor="name" required error={errors.name} className="sm:col-span-2">
              <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} invalid={Boolean(errors.name)} maxLength={100} />
            </Field>
            <Field label="Order" htmlFor="sortOrder" error={errors.sortOrder}>
              <Input id="sortOrder" type="number" value={form.sortOrder} onChange={(e) => update('sortOrder', e.target.value)} invalid={Boolean(errors.sortOrder)} />
            </Field>
          </div>
          <Field label="Link" htmlFor="url" required error={errors.url} hint={`Must start with https:// and be on ${allowed}.`}>
            <Input id="url" type="url" inputMode="url" value={form.url} onChange={(e) => update('url', e.target.value)} invalid={Boolean(errors.url)} />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description}>
            <TextArea id="description" rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} invalid={Boolean(errors.description)} maxLength={300} />
          </Field>
          <div className="flex items-center justify-between gap-4">
            <Toggle checked={form.published} onChange={(value) => update('published', value)} label="Show on the kiosk" />
            {isHttps(form.url) && (
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <QRCode value={form.url} size={72} level="M" />
              </div>
            )}
          </div>
        </>
      )}
    />
  );
}
