/**
 * @file: app/components/RichTextEditor.tsx
 * @description: Обёртка над react-quill для безопасного редактирования HTML-описания вакансии без ссылок
 * @dependencies: react-quill, dompurify
 * @created: 2025-11-22
 */
'use client';

import dynamic from 'next/dynamic';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
      ],
    }),
    []
  );

  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet'];

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={(content) => {
        const clean = DOMPurify.sanitize(content, {
          ALLOWED_TAGS: [
            'p',
            'br',
            'strong',
            'b',
            'em',
            'i',
            'u',
            'ul',
            'ol',
            'li',
            'h1',
            'h2',
            'h3',
            'h4',
            'span',
          ],
          ALLOWED_ATTR: ['style'],
        });
        onChange(clean);
      }}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      className="rich-text-editor"
    />
  );
}
