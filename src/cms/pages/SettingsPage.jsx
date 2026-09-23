import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { useResource } from '../components/useResource';
import { Alert, Button, Card, Field, Input, PageHeader, Spinner, Toggle } from '../components/ui';

const SITE_FIELDS = [
  { key: 'libraryName', label: 'Library name', hint: 'Large heading on the home screen.', required: true, max: 80 },
  { key: 'welcomeMessage', label: 'Welcome message', hint: 'Line under the heading.', max: 160 },
  { key: 'openingHours', label: "Today's hours", hint: 'e.g. 7:00 AM - 11:00 PM. Leave empty to hide.', max: 80 },
  { key: 'wifiNetwork', label: 'WiFi network name', hint: 'Leave empty to hide.', max: 60 },
  { key: 'helpDeskName', label: 'Help desk name', hint: 'e.g. Information Desk', max: 60 },
  { key: 'helpDeskLocation', label: 'Help desk location', hint: 'e.g. Ground Floor', max: 80 },
  { key: 'helpPhone', label: 'Help phone / extension', hint: 'e.g. Ext. 2150', max: 60 }
];

function useForm(initial) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  return { form, setForm, errors, setErrors, saving, setSaving, update };
}

export default function SettingsPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useResource('/api/cms/settings');
  const { data: meta } = useResource('/api/cms/meta');
  const general = useForm({ idleTimeoutMinutes: 5, autoResetHome: true });
  const site = useForm(Object.fromEntries(SITE_FIELDS.map((f) => [f.key, ''])));

  useEffect(() => {
    if (!data) return;
    general.setForm({
      idleTimeoutMinutes: Math.round((data.general?.idleTimeout ?? 300000) / 60000),
      autoResetHome: data.general?.autoResetHome ?? true
    });
    site.setForm(Object.fromEntries(SITE_FIELDS.map((f) => [f.key, data.site?.[f.key] ?? ''])));
  }, [data]);

  const minMinutes = Math.round((meta?.idleTimeout?.min ?? 60000) / 60000);
  const maxMinutes = Math.round((meta?.idleTimeout?.max ?? 1800000) / 60000);

  const saveGeneral = async (event) => {
    event.preventDefault();
    general.setSaving(true);
    try {
      await api.put('/api/cms/settings/general', {
        idleTimeout: Math.round(Number(general.form.idleTimeoutMinutes) * 60000),
        autoResetHome: general.form.autoResetHome
      });
      toast.success('Kiosk behaviour saved');
      reload();
    } catch (err) {
      general.setErrors(err.errors ?? {});
      toast.error(err.message);
    } finally {
      general.setSaving(false);
    }
  };

  const saveSite = async (event) => {
    event.preventDefault();
    site.setSaving(true);
    try {
      await api.put('/api/cms/settings/site', site.form);
      toast.success('Library details saved');
      reload();
    } catch (err) {
      site.setErrors(err.errors ?? {});
      if (!err.errors) toast.error(err.message);
    } finally {
      site.setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Kiosk settings" description="Details shown on the kiosk screens and how the kiosk behaves when nobody is using it." />
      {error && <Alert tone="error" className="mb-4">{error.message}</Alert>}
      {loading && !data ? (
        <div className="flex justify-center py-16"><Spinner className="w-6 h-6 text-primary-600" /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <Card title="Library details" description="Text on the home, FAQ and accessibility screens." className="xl:col-span-3">
            <form onSubmit={saveSite} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SITE_FIELDS.map((field) => (
                  <Field key={field.key} label={field.label} htmlFor={`site-${field.key}`} hint={field.hint} required={field.required} error={site.errors[field.key]} className={field.key === 'libraryName' || field.key === 'welcomeMessage' ? 'sm:col-span-2' : ''}>
                    <Input id={`site-${field.key}`} value={site.form[field.key]} maxLength={field.max} onChange={(e) => site.update(field.key, e.target.value)} invalid={Boolean(site.errors[field.key])} />
                  </Field>
                ))}
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={site.saving}>Save library details</Button>
              </div>
            </form>
          </Card>

          <Card title="Kiosk behaviour" description="Applies to every kiosk that uses this server." className="xl:col-span-2">
            <form onSubmit={saveGeneral} className="space-y-5" noValidate>
              <Field label="Idle timeout (minutes)" htmlFor="idleTimeout" hint={`Between ${minMinutes} and ${maxMinutes} minutes. After this, the kiosk returns to the home screen and clears the visitor's accessibility choices.`} error={general.errors.idleTimeout}>
                <Input id="idleTimeout" type="number" min={minMinutes} max={maxMinutes} step={1} value={general.form.idleTimeoutMinutes} onChange={(e) => general.update('idleTimeoutMinutes', e.target.value)} invalid={Boolean(general.errors.idleTimeout)} className="w-32" />
              </Field>
              <Toggle checked={general.form.autoResetHome} onChange={(value) => general.update('autoResetHome', value)} label="Return to the home screen when idle" description="When off, the kiosk stays on the current screen but still resets accessibility settings." />
              <div className="flex justify-end">
                <Button type="submit" loading={general.saving}>Save behaviour</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
