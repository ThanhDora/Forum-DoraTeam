"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CodeBlock from "@tiptap/extension-code-block";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Undo,
  Redo,
  Minus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/api";
import { toast } from "sonner";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "compact" | "full";
  onSubmit?: () => void;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
  variant = "full",
  onSubmit,
}: TiptapEditorProps) {
  const isUploading = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: true, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      TextStyle,
      Color,
      CodeBlock,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ...(variant === "full"
        ? [
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
          ]
        : []),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "tiptap-content outline-none",
          variant === "compact" ? "px-4 py-2 min-h-[40px]" : "px-6 py-4 min-h-[160px]"
        ),
      },
      handleKeyDown: (_view, event) => {
        if (variant === "compact" && event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const currentHTML = editor.getHTML();
    if (value !== currentHTML && !(value === "" && currentHTML === "<p></p>")) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor || isUploading.current) return;

      isUploading.current = true;
      const toastId = toast.loading("Uploading image...");
      try {
        const { url } = await uploadFile(file);
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        toast.success("Image uploaded", { id: toastId });
      } catch (err) {
        toast.error(
          "Upload failed: " +
            (err instanceof Error ? err.message : "Unknown error"),
          { id: toastId }
        );
      } finally {
        isUploading.current = false;
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [editor]
  );

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-all",
        active
          ? "bg-emerald-500/20 text-emerald-400"
          : "text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10"
      )}
    >
      {children}
    </button>
  );

  const iconSize = "h-3.5 w-3.5";

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all focus-within:border-emerald-500/30",
        className
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
      />

      {/* Toolbar */}
      <div
        className={cn(
          "flex items-center gap-0.5 px-2 border-b border-white/5 bg-white/[0.01] flex-wrap",
          variant === "compact" ? "py-1" : "py-1.5"
        )}
      >
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <UnderlineIcon className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline Code"
        >
          <Code className={iconSize} />
        </ToolbarButton>

        {/* Separator */}
        <div className="w-px h-4 bg-white/5 mx-1" />

        {/* Lists & Quotes */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote className={iconSize} />
        </ToolbarButton>

        {variant === "full" && (
          <>
            {/* Separator */}
            <div className="w-px h-4 bg-white/5 mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              active={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className={iconSize} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className={iconSize} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className={iconSize} />
            </ToolbarButton>

            {/* Separator */}
            <div className="w-px h-4 bg-white/5 mx-1" />

            {/* Alignment */}
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("left").run()
              }
              active={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              <AlignLeft className={iconSize} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              active={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              <AlignCenter className={iconSize} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
              active={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              <AlignRight className={iconSize} />
            </ToolbarButton>

            {/* Separator */}
            <div className="w-px h-4 bg-white/5 mx-1" />

            {/* Code Block */}
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleCodeBlock().run()
              }
              active={editor.isActive("codeBlock")}
              title="Code Block"
            >
              <Code className={iconSize} />
            </ToolbarButton>

            {/* Horizontal Rule */}
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setHorizontalRule().run()
              }
              title="Horizontal Rule"
            >
              <Minus className={iconSize} />
            </ToolbarButton>

            {/* Table */}
            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              title="Insert Table"
            >
              <TableIcon className={iconSize} />
            </ToolbarButton>
          </>
        )}

        {/* Separator */}
        <div className="w-px h-4 bg-white/5 mx-1" />

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("Enter URL");
            if (url) {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            }
          }}
          active={editor.isActive("link")}
          title="Insert Link"
        >
          <LinkIcon className={iconSize} />
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image"
        >
          <ImageIcon className={iconSize} />
        </ToolbarButton>

        {variant === "full" && (
          <>
            {/* Separator */}
            <div className="w-px h-4 bg-white/5 mx-1" />

            {/* Undo / Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
            >
              <Undo className={iconSize} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
            >
              <Redo className={iconSize} />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        className={cn(
          "text-sm text-white/80 leading-relaxed font-medium",
          variant === "full" && "max-h-[500px] overflow-y-auto"
        )}
      />
    </div>
  );
}
