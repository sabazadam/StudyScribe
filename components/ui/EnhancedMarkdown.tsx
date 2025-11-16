'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

interface EnhancedMarkdownProps {
  content: string;
  className?: string;
}

export default function EnhancedMarkdown({ content, className = '' }: EnhancedMarkdownProps) {
  const components: Components = {
    // Headings with enhanced styling
    h1: ({ node, ...props }) => (
      <h1
        className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white border-b-2 border-purple-500 pb-2"
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2
        className="text-2xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2"
        {...props}
      />
    ),
    h3: ({ node, ...props }) => (
      <h3
        className="text-xl font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-100"
        {...props}
      />
    ),
    h4: ({ node, ...props }) => (
      <h4
        className="text-lg font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-200"
        {...props}
      />
    ),

    // Paragraphs with better spacing
    p: ({ node, ...props }) => (
      <p
        className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300 text-base"
        {...props}
      />
    ),

    // Lists with better styling
    ul: ({ node, ...props }) => (
      <ul
        className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300"
        {...props}
      />
    ),
    ol: ({ node, ...props }) => (
      <ol
        className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300"
        {...props}
      />
    ),
    li: ({ node, ...props }) => (
      <li
        className="leading-relaxed"
        {...props}
      />
    ),

    // Code blocks with syntax highlighting style
    code: ({ node, inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono border border-purple-200 dark:border-purple-800"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="block bg-gray-800 dark:bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 border border-gray-700"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Blockquotes with accent styling
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300"
        {...props}
      />
    ),

    // Strong/Bold with emphasis
    strong: ({ node, ...props }) => (
      <strong
        className="font-bold text-gray-900 dark:text-white"
        {...props}
      />
    ),

    // Emphasis/Italic
    em: ({ node, ...props }) => (
      <em
        className="italic text-gray-800 dark:text-gray-200"
        {...props}
      />
    ),

    // Links with hover effects
    a: ({ node, ...props }) => (
      <a
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
        {...props}
      />
    ),

    // Horizontal rules
    hr: ({ node, ...props }) => (
      <hr
        className="my-6 border-t-2 border-gray-300 dark:border-gray-600"
        {...props}
      />
    ),

    // Tables with styling
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table
          className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 border border-gray-300 dark:border-gray-600"
          {...props}
        />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead
        className="bg-gray-100 dark:bg-gray-800"
        {...props}
      />
    ),
    tbody: ({ node, ...props }) => (
      <tbody
        className="divide-y divide-gray-200 dark:divide-gray-700"
        {...props}
      />
    ),
    tr: ({ node, ...props }) => (
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        {...props}
      />
    ),
    th: ({ node, ...props }) => (
      <th
        className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td
        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
        {...props}
      />
    ),
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
