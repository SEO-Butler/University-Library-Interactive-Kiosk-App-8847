import React from 'react';
import { FiInbox, FiSearch } from 'react-icons/fi';

export const cx = (...classes) => classes.filter(Boolean).join(' ');

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm disabled:bg-primary-300',
  secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm disabled:text-gray-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:bg-red-300',
  ghost: 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
  link: 'text-primary-700 hover:underline px-0 disabled:text-gray-400'
};

const buttonSizes = {
  sm: 'px-2.5 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-3.5 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-3 text-base rounded-lg gap-2'
};

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, type = 'button', disabled, ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...rest}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'w-5 h-5' }) {
  return (
    <svg className={cx('animate-spin text-current', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Card({ title, description, actions, children, className, padded = true }) {
  return (
    <section className={cx('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div>
            {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

const controlClass = (invalid, extra) =>
  cx(
    'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500',
    invalid ? 'border-red-400' : 'border-gray-300',
    extra
  );

export function Input({ invalid, className, ...props }) {
  return <input className={controlClass(invalid, className)} aria-invalid={invalid || undefined} {...props} />;
}

export function TextArea({ invalid, className, rows = 4, ...props }) {
  return <textarea rows={rows} className={controlClass(invalid, className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({ invalid, className, children, ...props }) {
  return (
    <select className={controlClass(invalid, className)} aria-invalid={invalid || undefined} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={cx(
          'relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary-600' : 'bg-gray-300'
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {description && <span className="block text-xs text-gray-500">{description}</span>}
      </span>
    </button>
  );
}

const badgeTones = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  purple: 'bg-purple-100 text-purple-800'
};

export function Badge({ tone = 'gray', children, className }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', badgeTones[tone], className)}>
      {children}
    </span>
  );
}

const alertTones = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-900'
};

export function Alert({ tone = 'info', children, className }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-lg border px-4 py-3 text-sm', alertTones[tone], className)}>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon = FiInbox, title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      <Icon className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cx('relative', className)}>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={controlClass(false, 'pl-9')}
      />
    </div>
  );
}

// columns: [{ key, label, render?(row), className?, headerClassName? }]
export function Table({ columns, rows, rowKey = 'id', emptyMessage = 'Nothing here yet.', actions }) {
  if (!rows.length) {
    return <EmptyState title={emptyMessage} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx('px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500', column.headerClassName)}
              >
                {column.label}
              </th>
            ))}
            {actions && <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-gray-50/60">
              {columns.map((column) => (
                <td key={column.key} className={cx('px-4 py-3 align-top text-gray-800', column.className)}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
