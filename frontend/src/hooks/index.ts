import { useState, useCallback, useRef, useEffect } from 'react';
import { ZodSchema } from 'zod';
import { useAuthStore, Role } from '@/stores/authStore';

// ── useForm ───────────────────────────────────────────────────────────────────
// Custom form hook with zod validation — replaces react-hook-form
export function useForm<T extends Record<string, string>>(
  initialValues: T,
  schema: ZodSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error on change if field was already touched
      if (touched[name as keyof T]) {
        const result = schema.safeParse({ ...values, [name]: value });
        if (result.success) {
          setErrors((prev) => ({ ...prev, [name]: undefined }));
        } else {
          const fieldErr = result.error.flatten().fieldErrors[name as keyof T]?.[0];
          setErrors((prev) => ({ ...prev, [name]: fieldErr }));
        }
      }
    },
    [values, touched, schema]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const result = schema.safeParse({ ...values, [name]: value });
      if (!result.success) {
        const fieldErr = result.error.flatten().fieldErrors[name as keyof T]?.[0];
        setErrors((prev) => ({ ...prev, [name]: fieldErr }));
      }
    },
    [values, schema]
  );

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void>) =>
      async (e: React.FormEvent) => {
        e.preventDefault();
        const result = schema.safeParse(values);
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors;
          const mapped = Object.fromEntries(
            Object.entries(fieldErrors).map(([k, v]) => [k, (v as string[])[0]])
          ) as Partial<Record<keyof T, string>>;
          setErrors(mapped);
          setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])) as any);
          return;
        }
        setIsSubmitting(true);
        try {
          await onSubmit(result.data);
        } finally {
          setIsSubmitting(false);
        }
      },
    [values, schema]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, reset };
}

// ── useToast ──────────────────────────────────────────────────────────────────
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

type ToastListener = (toasts: Toast[]) => void;

// Singleton toast store (no context needed)
let toasts: Toast[] = [];
const listeners: Set<ToastListener> = new Set();

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

export const toast = {
  show(message: string, type: Toast['type'] = 'info') {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, message, type }];
    notify();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, 3000);
  },
  success: (msg: string) => toast.show(msg, 'success'),
  error: (msg: string) => toast.show(msg, 'error'),
  info: (msg: string) => toast.show(msg, 'info'),
};

export function useToastState() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);
  return items;
}

// ── useRole ───────────────────────────────────────────────────────────────────
export function useRole() {
  const user = useAuthStore((s) => s.user);
  const role: Role = user?.role ?? 'GUEST';

  return {
    role,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isModerator: role === 'MODERATOR',
    isRegularUser: role === 'REGULAR_USER',
    isGuest: role === 'GUEST',
    canCreatePost: ['SUPER_ADMIN', 'MODERATOR', 'REGULAR_USER'].includes(role),
    canDeletePost: (authorId: string) =>
      role === 'SUPER_ADMIN' ||
      role === 'MODERATOR' ||
      (role === 'REGULAR_USER' && user?.id === authorId),
    canEditPost: (authorId: string) =>
      role === 'REGULAR_USER' && user?.id === authorId,
    canCreateComment: ['SUPER_ADMIN', 'MODERATOR', 'REGULAR_USER'].includes(role),
    canDeleteComment: (commentAuthorId: string, postAuthorId: string) =>
      role === 'SUPER_ADMIN' ||
      role === 'MODERATOR' ||
      user?.id === commentAuthorId ||
      (role === 'REGULAR_USER' && user?.id === postAuthorId),
    canManageUsers: role === 'SUPER_ADMIN',
    userId: user?.id,
  };
}

// ── useDebounce ───────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── useClickOutside ───────────────────────────────────────────────────────────
export function useClickOutside(handler: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [handler]);
  return ref;
}
