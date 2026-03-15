"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Type,
  Eye,
  Edit3,
  Quote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

import { toast } from "sonner";
import { uploadFile } from "@/lib/api";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function MarkdownEditor({ value, onChange, placeholder, className, onKeyDown }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.substring(start, end);
    const replacement = before + selection + after;
    
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading archive data...");
    try {
      const { url } = await uploadFile(file);
      insertText(`![${file.name}](${url})`);
      toast.success("Data payload established", { id: toastId });
    } catch (err) {
      toast.error("Transmission failed: " + (err instanceof Error ? err.message : "Internal error"), { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => insertText("**", "**"), key: "b" },
    { icon: Italic, label: "Italic", action: () => insertText("_", "_"), key: "i" },
    { icon: Quote, label: "Quote", action: () => insertText("> "), key: "q" },
    { icon: Code, label: "Code", action: () => insertText("`", "`"), key: "e" },
    { icon: List, label: "List", action: () => insertText("- "), key: "l" },
    { icon: LinkIcon, label: "Link", action: () => insertText("[", "](url)"), key: "k" },
    { icon: ImageIcon, label: "Image", action: () => fileInputRef.current?.click(), key: "g" },
  ];

  return (
    <div className={cn("flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all focus-within:border-emerald-500/30", isUploading && "opacity-50 pointer-events-none", className)}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              title={`${btn.label} (Ctrl+${btn.key})`}
              className="p-1.5 rounded-lg text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              <btn.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
            isPreview 
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
              : "text-white/20 hover:text-white hover:bg-white/5"
          )}
        >
          {isPreview ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor / Preview Area */}
      <div className="relative min-h-[120px] flex">
        {isPreview ? (
          <div className="flex-1 p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <span className="text-[10px] font-black text-white/5 uppercase italic">Empty Data Stream...</span>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder || "Input telemetry data..."}
            className="flex-1 bg-transparent border-none outline-none p-4 text-sm text-white/80 placeholder:text-white/5 resize-y min-h-[120px] font-medium leading-relaxed custom-scrollbar"
          />
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
}
