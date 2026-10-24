import { useEffect, useRef } from 'react';

export function useFormFocus(
  error: Error | null,
  validation: Record<string, string>,
) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = formRef.current;
    const target =
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>('[data-form-error]');
    target?.focus();
  }, [error, validation]);
  return formRef;
}
