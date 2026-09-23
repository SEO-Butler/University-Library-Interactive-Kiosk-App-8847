import React from 'react';
import EntityPage from '../components/EntityPage';
import { ImageUpload } from '../components/ImageUpload';
import { Badge, Field, Input, Select, TextArea, Toggle } from '../components/ui';
import { formatDate, todayIso } from '../lib/format';

const priorityTone = { high: 'red', medium: 'blue', low: 'gray' };

export default function AnnouncementsPage() {
  return (
    <EntityPage
      title="Announcements"
      description="News and events for the kiosk's News & Events screen. Events dated in the future are also listed under Upcoming Highlights."
      endpoint="/api/cms/announcements"
      itemName="announcement"
      searchKeys={['title', 'content']}
      columns={[
        {
          key: 'title', label: 'Title',
          render: (row) => (
            <div className="flex items-start gap-3">
              {row.imageUrl && <img src={row.imageUrl} alt="" className="h-10 w-14 rounded object-cover flex-shrink-0" />}
              <div>
                <p className="font-medium text-gray-900">{row.title}</p>
                <p className="text-gray-500 line-clamp-1 max-w-md">{row.content}</p>
              </div>
            </div>
          )
        },
        { key: 'type', label: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
        { key: 'date', label: 'Date', render: (row) => <span className="whitespace-nowrap">{formatDate(row.date)}</span> },
        { key: 'priority', label: 'Priority', render: (row) => <Badge tone={priorityTone[row.priority]}>{row.priority}</Badge> },
        {
          key: 'published', label: 'Status',
          render: (row) => {
            const expired = row.expiresOn && row.expiresOn < todayIso();
            if (!row.published) return <Badge>Hidden</Badge>;
            if (expired) return <Badge tone="amber">Expired</Badge>;
            return <Badge tone="green">Live</Badge>;
          }
        }
      ]}
      defaults={() => ({
        title: '', content: '', type: 'info', date: todayIso(), priority: 'medium',
        published: true, expiresOn: '', image: null
      })}
      fromItem={(item) => ({
        title: item.title, content: item.content, type: item.type, date: item.date,
        priority: item.priority, published: item.published, expiresOn: item.expiresOn ?? '',
        image: item.imageId ? { id: item.imageId, url: item.imageUrl } : null
      })}
      toPayload={({ image, expiresOn, ...form }) => ({
        ...form, expiresOn: expiresOn || null, imageId: image?.id ?? null
      })}
      renderForm={({ form, update, errors }) => (
        <>
          <Field label="Title" htmlFor="title" required error={errors.title}>
            <Input id="title" value={form.title} onChange={(e) => update('title', e.target.value)} invalid={Boolean(errors.title)} maxLength={200} />
          </Field>
          <Field label="Text" htmlFor="content" required error={errors.content}>
            <TextArea id="content" rows={5} value={form.content} onChange={(e) => update('content', e.target.value)} invalid={Boolean(errors.content)} maxLength={5000} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Type" htmlFor="type" error={errors.type}>
              <Select id="type" value={form.type} onChange={(e) => update('type', e.target.value)}>
                <option value="info">Information</option>
                <option value="event">Event</option>
              </Select>
            </Field>
            <Field label={form.type === 'event' ? 'Event date' : 'Date'} htmlFor="date" required error={errors.date}>
              <Input id="date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} invalid={Boolean(errors.date)} />
            </Field>
            <Field label="Priority" htmlFor="priority" error={errors.priority} hint="High shows an Important badge.">
              <Select id="priority" value={form.priority} onChange={(e) => update('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <Field label="Hide after" htmlFor="expiresOn" error={errors.expiresOn} hint="Optional. The kiosk stops showing it after this day.">
              <Input id="expiresOn" type="date" value={form.expiresOn} onChange={(e) => update('expiresOn', e.target.value)} invalid={Boolean(errors.expiresOn)} />
            </Field>
            <div className="pt-7">
              <Toggle checked={form.published} onChange={(value) => update('published', value)} label="Show on the kiosk" description="Turn off to keep a draft." />
            </div>
          </div>
          <ImageUpload label="Picture (optional)" value={form.image} onChange={(image) => update('image', image)} hint="Shown above the text. PNG, JPEG, WebP or GIF up to 10 MB." />
        </>
      )}
    />
  );
}
