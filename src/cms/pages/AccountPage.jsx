import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import { Alert, Button, Card, Field, Input, PageHeader } from '../components/ui';

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed. Other devices have been signed out.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setErrors({});
    } catch (err) {
      setErrors(err.errors ?? { form: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Your account" description={`Signed in as ${user.displayName || user.username} (${user.role}).`} />
      <Card title="Change password" className="max-w-lg">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {errors.form && <Alert tone="error">{errors.form}</Alert>}
          <Field label="Current password" htmlFor="currentPassword" required error={errors.currentPassword}>
            <Input id="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={update('currentPassword')} invalid={Boolean(errors.currentPassword)} />
          </Field>
          <Field label="New password" htmlFor="newPassword" required error={errors.newPassword} hint="At least 10 characters.">
            <Input id="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={update('newPassword')} invalid={Boolean(errors.newPassword)} />
          </Field>
          <Field label="Repeat new password" htmlFor="confirm" required error={errors.confirm}>
            <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} invalid={Boolean(errors.confirm)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Change password</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
