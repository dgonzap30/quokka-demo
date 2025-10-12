"use client";

import { useState } from "react";
import { FileText, Plus, Trash2, Edit2, Check } from "lucide-react";
import type { ResponseTemplate, TemplateCategory } from "@/lib/models/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ResponseTemplatesPickerProps {
  /** Available templates */
  templates: ResponseTemplate[];

  /** Callback when template is selected */
  onSelectTemplate: (template: ResponseTemplate) => void;

  /** Callback to create new template */
  onCreateTemplate?: () => void;

  /** Callback to delete template */
  onDeleteTemplate?: (templateId: string) => void;

  /** Whether picker is disabled */
  disabled?: boolean;

  /** Optional CSS classes */
  className?: string;
}

const categoryColors: Record<TemplateCategory, string> = {
  clarification: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  encouragement: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  correction: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  reference: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

/**
 * Dropdown picker for response templates
 *
 * Allows instructors to quickly insert pre-written responses.
 * Templates are organized by category and show usage count.
 *
 * Features:
 * - Grouped by category
 * - Usage count indicator
 * - Quick insert
 * - Template management (create/delete)
 *
 * @example
 * ```tsx
 * <ResponseTemplatesPicker
 *   templates={templates}
 *   onSelectTemplate={(template) => insertText(template.content)}
 *   onCreateTemplate={() => openTemplateDialog()}
 * />
 * ```
 */
export function ResponseTemplatesPicker({
  templates,
  onSelectTemplate,
  onCreateTemplate,
  onDeleteTemplate,
  disabled = false,
  className,
}: ResponseTemplatesPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<TemplateCategory, ResponseTemplate[]>);

  const handleSelectTemplate = (template: ResponseTemplate) => {
    onSelectTemplate(template);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={className}
          aria-label="Open response templates"
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
          Templates
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel>Response Templates</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {templates.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No templates yet. Create one to get started!
          </div>
        ) : (
          <>
            {(Object.keys(groupedTemplates) as TemplateCategory[]).map((category) => (
              <div key={category} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground capitalize">
                  {category}
                </div>
                {groupedTemplates[category].map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onSelect={() => handleSelectTemplate(template)}
                    className="flex items-start justify-between gap-2 px-2 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {template.title}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-full text-xs font-medium shrink-0",
                            categoryColors[template.category]
                          )}
                        >
                          {template.category}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Used {template.usageCount} times</span>
                        {template.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="truncate">
                              {template.tags.slice(0, 2).join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {onDeleteTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTemplate(template.id);
                        }}
                        aria-label={`Delete template: ${template.title}`}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-danger" />
                      </Button>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </>
        )}

        {onCreateTemplate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onCreateTemplate}
              className="text-primary"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create New Template
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
