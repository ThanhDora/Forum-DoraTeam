"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  disallowLinks?: boolean;
}

export function MarkdownRenderer({ content, className, disallowLinks }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content prose prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-emerald-500" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-black uppercase italic tracking-tighter mt-8 mb-4 border-l-4 border-emerald-500 pl-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-bold uppercase tracking-tight mt-6 mb-3" {...props} />,
          p: ({ node, children, ...props }: any) => {
            const hasBlockChild = (n: any): boolean => {
              if (n.tagName === "img") return true;
              if (n.children) {
                return n.children.some((child: any) => hasBlockChild(child));
              }
              return false;
            };

            if (hasBlockChild(node)) {
              return <div className="mb-4 leading-relaxed text-white/80" {...props}>{children}</div>;
            }
            return <p className="mb-4 leading-relaxed text-white/80" {...props}>{children}</p>;
          },
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 ml-4 space-y-1 text-white/80" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 ml-4 space-y-1 text-white/80" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <div className="relative my-6 group">
                <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                <pre className="relative bg-black/80 border border-white/10 rounded-xl p-4 overflow-x-auto font-mono text-sm leading-relaxed" {...props}>
                  <code className={className}>{children}</code>
                </pre>
              </div>
            ) : (
              <code className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs border border-emerald-500/20" {...props}>
                {children}
              </code>
            );
          },
          img: ({ node, ...props }) => {
            // Safety check: Don't render if src is missing, empty, or obviously malformed (like a literal markdown tag)
            const src = typeof props.src === 'string' ? props.src : '';
            if (!src || src.startsWith('![') || src === '()') return null;
            
            return (
              <div className="relative my-4 group overflow-hidden rounded-2xl border border-white/10 max-w-sm">
                <img className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105" {...props} />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{props.alt || "Visual Archive"}</span>
                </div>
              </div>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-emerald-500/50 bg-emerald-500/5 px-6 py-4 rounded-r-2xl italic text-white/60 mb-6" {...props} />
          ),
          strong: ({ node, ...props }) => <strong className="font-black text-emerald-400 uppercase" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-white/90" {...props} />,
          table: ({ node, ...props }) => (
            <div className="my-8 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="px-4 py-3 bg-white/5 font-black uppercase tracking-widest text-[10px] text-white/40 border-b border-white/10" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-3 text-white/60 border-b border-white/5" {...props} />,
          a: ({ node, ...props }) => {
            if (disallowLinks) {
              return <span className="text-emerald-500 font-medium" {...props} />;
            }
            return <a className="text-emerald-500 hover:text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>

      <style jsx global>{`
        .markdown-content span[style*="color"] {
          color: inherit; /* Allow rehype-raw to handle colors properly if defined in inline styles */
        }
      `}</style>
    </div>
  );
}
