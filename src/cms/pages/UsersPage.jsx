import React, { useState } from 'react';
import { FiEdit2, FiKey, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import { useResource } from '../components/useResource';
import { ConfirmDialog, Modal } from '../components/Modal';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Table, Toggle } from '../components/ui';
import { formatDateTime } from '../lib/format';

const emptyUser = { username: '', displayName: '', role: 'editor', isActive: true, password: '' };

export default function UsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const { data, error, loading, reload } = useResource('/api/cms/users');
  const [editor, setEditor] = useState(null); // { id|null, form, errors, saving }
  const [passwordFor, setPasswordFor] = useState(null); // { user, password, error, saving }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const update = (field, value) =>
    setEditor((current) => ({ ...current, form: { ...current.form, [field]: value }, errors: { ...current.errors, [field]: undefined } }));

  const save = async (event) => {
    event.preventDefault();
    setEditor((current) => ({ ...current, saving: true }));
    try {
      if (editor.id === null) {
        await api.post('/api/cms/users', editor.form);
        toast.success('User created');
      } else {
        const { displayName, role, isActive } = editor.form;
        await api.put(`/api/cms/users/${editor.id}`, { displayName, role, isActive });
        toast.success('User updated');
      }
      setEditor(null);
      reload();
    } catch (err) {
      setEditor((current) => current && { ...current, saving: false, errors: err.errors ?? {}, message: err.message });
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordFor((current) => ({ ...current, saving: true, error: null }));
    try {
      await api.post(`/api/cms/users/${passwordFor.user.id}/password`, { password: passwordFor.password });
      toast.success(`Password reset for ${passwordFor.user.username}`);
      setPasswordFor(null);
    } catch (err) {
      setPasswordFor((current) => current && { ...current, saving: false, error: err.errors?.password ?? err.message });
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/cms/users/${pendingDelete.id}`);
      toast.success('User deleted');
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
        title="Users"
        description="Who can sign in to this content manager. Editors manage content and settings; admins also manage users."
        actions={<Button onClick={() => setEditor({ id: null, form: { ...emptyUser }, errors: {}, saving: false })}><FiPlus aria-hidden="true" /> Add user</Button>}
      />
      {error && <Alert tone="error" className="mb-4">{error.message}</Alert>}
      <Card padded={false}>
        {loading && !data ? (
          <div className="flex justify-center py-12"><Spinner className="w-6 h-6 text-primary-600" /></div>
        ) : (
          <Table
            columns={[
              {
                key: 'username', label: 'User',
                render: (row) => (
                  <div>
                    <p className="font-medium text-gray-900">{row.displayName || row.username}{row.id === me.id && <span className="text-xs text-gray-400 ml-2">(you)</span>}</p>
                    <p className="text-gray-500 font-mono text-xs">{row.username}</p>
                  </div>
                )
              },
              { key: 'role', label: 'Role', render: (row) => <Badge tone={row.role === 'admin' ? 'purple' : 'blue'}>{row.role}</Badge> },
              { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>) },
              { key: 'lastLoginAt', label: 'Last sign-in', render: (row) => <span className="text-gray-500 whitespace-nowrap">{formatDateTime(row.lastLoginAt) || 'never'}</span> }
            ]}
            rows={data ?? []}
            actions={(row) => (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditor({ id: row.id, form: { ...row }, errors: {}, saving: false })}><FiEdit2 aria-hidden="true" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setPasswordFor({ user: row, password: '', error: null, saving: false })}><FiKey aria-hidden="true" /> Password</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" disabled={row.id === me.id} onClick={() => setPendingDelete(row)} aria-label="Delete user"><FiTrash2 aria-hidden="true" /></Button>
              </>
            )}
          />
        )}
      </Card>

      <Modal
        open={Boolean(editor)}
        title={editor?.id === null ? 'Add user' : `Edit ${editor?.form.username}`}
        onClose={editor?.saving ? undefined : () => setEditor(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={editor?.saving}>Cancel</Button>
            <Button type="submit" form="user-form" loading={editor?.saving}>Save</Button>
          </>
        }
      >
        {editor && (
          <form id="user-form" onSubmit={save} className="space-y-4" noValidate>
            {editor.message && !Object.keys(editor.errors).length && <Alert tone="error">{editor.message}</Alert>}
            {editor.id === null && (
              <Field label="Username" htmlFor="username" required error={editor.errors.username} hint="Lowercase letters, digits, dot, dash or underscore.">
                <Input id="username" autoComplete="off" value={editor.form.username} onChange={(e) => update('username', e.target.value.toLowerCase())} invalid={Boolean(editor.errors.username)} />
              </Field>
            )}
            <Field label="Display name" htmlFor="displayName" error={editor.errors.displayName}>
              <Input id="displayName" value={editor.form.displayName ?? ''} onChange={(e) => update('displayName', e.target.value)} maxLength={80} />
            </Field>
            <Field label="Role" htmlFor="role" error={editor.errors.role}>
              <Select id="role" value={editor.form.role} onChange={(e) => update('role', e.target.value)} disabled={editor.id === me.id}>
                <option value="editor">Editor – content and settings</option>
                <option value="admin">Admin – content, settings and users</option>
              </Select>
            </Field>
            {editor.id === null ? (
              <Field label="Password" htmlFor="password" required error={editor.errors.password} hint="At least 10 characters. Share it securely; the user can change it after signing in.">
                <Input id="password" type="password" autoComplete="new-password" value={editor.form.password} onChange={(e) => update('password', e.target.value)} invalid={Boolean(editor.errors.password)} />
              </Field>
            ) : (
              <Toggle checked={editor.form.isActive} onChange={(value) => update('isActive', value)} disabled={editor.id === me.id} label="Account enabled" description="Disabled users are signed out immediately and cannot sign in." />
            )}
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(passwordFor)}
        title={`Reset password for ${passwordFor?.user.username}`}
        onClose={passwordFor?.saving ? undefined : () => setPasswordFor(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordFor(null)} disabled={passwordFor?.saving}>Cancel</Button>
            <Button type="submit" form="password-form" loading={passwordFor?.saving}>Set password</Button>
          </>
        }
      >
        {passwordFor && (
          <form id="password-form" onSubmit={savePassword} className="space-y-4" noValidate>
            <Field label="New password" htmlFor="new-password" required error={passwordFor.error} hint="At least 10 characters. The user is signed out everywhere.">
              <Input id="new-password" type="password" autoComplete="new-password" value={passwordFor.password} onChange={(e) => setPasswordFor((c) => ({ ...c, password: e.target.value, error: null }))} invalid={Boolean(passwordFor.error)} />
            </Field>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.username}?`}
        message="The account is removed and signed out immediately. Their past changes stay in the activity log."
        onConfirm={remove}
        onCancel={() => setPendingDelete(null)}
        busy={deleting}
      />
    </>
  );
}
