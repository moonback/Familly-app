import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpenIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';

interface ManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualDialog({ open, onOpenChange }: ManualDialogProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/manuel.md')
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error('Failed to load manual', err));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            Manuel d'utilisation
          </DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-4xl font-bold text-center mb-8 text-[var(--child-color)] tracking-tight" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-semibold mt-10 mb-6 text-[var(--child-color)] tracking-tight border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-base leading-relaxed mb-6 text-gray-600 dark:text-gray-400" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-8 mb-6 space-y-3" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-base text-gray-600 dark:text-gray-400" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-[var(--child-color)] dark:text-[var(--child-color)]" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-gray-500 dark:text-gray-400" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-12 border-t-2 border-gray-200 dark:border-gray-700" {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManualButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <BookOpenIcon className="h-4 w-4" />
      Manuel d'utilisation
    </Button>
  );
} 