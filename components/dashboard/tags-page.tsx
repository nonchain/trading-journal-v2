import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { tagFormSchema, type TagFormValues } from '@/lib/schemas';
import { journalRepo } from '@/lib/storage';
import type { EmotionTag, Setup } from '@/lib/types';

function TagEditorDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial?: TagFormValues;
  onSave: (values: TagFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema) as never,
    values: initial ?? { name: '', color: '#3B82F6' },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await onSave(values);
              onOpenChange(false);
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tags.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tags.color')}</FormLabel>
                  <FormControl>
                    <Input type="color" className="h-10 w-20 p-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TagList({
  title,
  empty,
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; name: string; color: string }>;
  onAdd: () => void;
  onEdit: (item: { id: string; name: string; color: string }) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button size="sm" onClick={onAdd}>
          <Icon name="add-line" />
          {t('common.create')}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title={empty} description="" />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(item)}
                >
                  <Icon name="pencil-line" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(item.id)}
                >
                  <Icon name="delete-bin-line" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TagsPage({
  setups,
  emotions,
  onChanged,
}: {
  setups: Setup[];
  emotions: EmotionTag[];
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<'setup' | 'emotion'>('setup');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);

  async function save(values: TagFormValues) {
    try {
      if (kind === 'setup') {
        if (editing) await journalRepo.updateSetup(editing.id, values);
        else await journalRepo.createSetup(values);
      } else if (editing) {
        await journalRepo.updateEmotionTag(editing.id, values);
      } else {
        await journalRepo.createEmotionTag(values);
      }
      toast.success(t('toast.tagSaved'));
      onChanged();
    } catch {
      toast.error(t('toast.error'));
    }
  }

  async function remove(type: 'setup' | 'emotion', id: string) {
    if (!confirm(t('tags.deleteConfirm'))) return;
    try {
      if (type === 'setup') await journalRepo.deleteSetup(id);
      else await journalRepo.deleteEmotionTag(id);
      toast.success(t('toast.tagDeleted'));
      onChanged();
    } catch {
      toast.error(t('toast.error'));
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <TagList
        title={t('tags.setups')}
        empty={t('tags.emptySetups')}
        items={setups}
        onAdd={() => {
          setKind('setup');
          setEditing(null);
          setOpen(true);
        }}
        onEdit={(item) => {
          setKind('setup');
          setEditing(item);
          setOpen(true);
        }}
        onDelete={(id) => remove('setup', id)}
      />
      <TagList
        title={t('tags.emotions')}
        empty={t('tags.emptyEmotions')}
        items={emotions}
        onAdd={() => {
          setKind('emotion');
          setEditing(null);
          setOpen(true);
        }}
        onEdit={(item) => {
          setKind('emotion');
          setEditing(item);
          setOpen(true);
        }}
        onDelete={(id) => remove('emotion', id)}
      />

      <TagEditorDialog
        open={open}
        onOpenChange={setOpen}
        title={
          editing
            ? t('tags.editTag')
            : kind === 'setup'
              ? t('tags.addSetup')
              : t('tags.addEmotion')
        }
        initial={
          editing
            ? { name: editing.name, color: editing.color }
            : undefined
        }
        onSave={save}
      />
    </div>
  );
}
