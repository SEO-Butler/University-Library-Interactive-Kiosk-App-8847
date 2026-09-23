import React from 'react';
import EntityPage from '../components/EntityPage';
import { useResource } from '../components/useResource';
import { Badge, Field, Input, TextArea, Toggle } from '../components/ui';

export default function FaqsPage() {
  const { data: dashboard } = useResource('/api/cms/dashboard');
  const categories = dashboard?.faqCategories ?? [];

  return (
    <EntityPage
      title="FAQs"
      description="Questions and answers for the Help & FAQ screen. Visitors can search them and filter by category."
      endpoint="/api/cms/faqs"
      itemName="FAQ"
      searchKeys={['question', 'answer', 'category']}
      columns={[
        { key: 'category', label: 'Category', render: (row) => <Badge tone="blue">{row.category}</Badge> },
        {
          key: 'question', label: 'Question',
          render: (row) => (
            <div>
              <p className="font-medium text-gray-900">{row.question}</p>
              <p className="text-gray-500 line-clamp-1 max-w-lg">{row.answer}</p>
            </div>
          )
        },
        { key: 'sortOrder', label: 'Order', className: 'text-gray-500' },
        { key: 'published', label: 'Status', render: (row) => (row.published ? <Badge tone="green">Live</Badge> : <Badge>Hidden</Badge>) }
      ]}
      defaults={() => ({ category: categories[0] ?? 'General', question: '', answer: '', sortOrder: 0, published: true })}
      fromItem={(item) => ({ category: item.category, question: item.question, answer: item.answer, sortOrder: item.sortOrder, published: item.published })}
      toPayload={(form) => ({ ...form, sortOrder: Number(form.sortOrder) || 0 })}
      renderForm={({ form, update, errors }) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Category" htmlFor="category" required error={errors.category} className="sm:col-span-2" hint="Type a new name to create a category.">
              <Input id="category" list="faq-categories" value={form.category} onChange={(e) => update('category', e.target.value)} invalid={Boolean(errors.category)} maxLength={60} />
              <datalist id="faq-categories">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </Field>
            <Field label="Order" htmlFor="sortOrder" error={errors.sortOrder} hint="Lower numbers come first.">
              <Input id="sortOrder" type="number" value={form.sortOrder} onChange={(e) => update('sortOrder', e.target.value)} invalid={Boolean(errors.sortOrder)} />
            </Field>
          </div>
          <Field label="Question" htmlFor="question" required error={errors.question}>
            <Input id="question" value={form.question} onChange={(e) => update('question', e.target.value)} invalid={Boolean(errors.question)} maxLength={300} />
          </Field>
          <Field label="Answer" htmlFor="answer" required error={errors.answer}>
            <TextArea id="answer" rows={5} value={form.answer} onChange={(e) => update('answer', e.target.value)} invalid={Boolean(errors.answer)} maxLength={5000} />
          </Field>
          <Toggle checked={form.published} onChange={(value) => update('published', value)} label="Show on the kiosk" />
        </>
      )}
    />
  );
}
