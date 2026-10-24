import { loginSchema, registerSchema } from '@devtrack/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { ApiError } from '../../lib/api/client';
import { useCurrentUser, useSignIn } from '../../features/auth/hooks/useAuth';
import { QueryError } from '../../components/ui/QueryError';
import { LoadingState } from '../../components/ui/LoadingState';
import { useFormFocus } from '../../lib/forms/useFormFocus';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const current = useCurrentUser();
  const mutation = useSignIn(mode);
  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validation, setValidation] = useState<Record<string, string>>({});
  const formRef = useFormFocus(mutation.error, validation);
  const registering = mode === 'register';
  const details = {
    ...(mutation.error instanceof ApiError ? mutation.error.details : {}),
    ...validation,
  };
  if (current.isPending)
    return (
      <main id="main-content" tabIndex={-1}>
        <LoadingState label="Checking your session…" />
      </main>
    );
  if (current.isError)
    return (
      <main id="main-content" tabIndex={-1}>
        <QueryError
          resource="session"
          error={current.error}
          retry={() => {
            void current.refetch();
          }}
        />
      </main>
    );
  if (current.data) return <Navigate to="/dashboard" replace />;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const input = registering
      ? { name: fields.name, email: fields.email, password: fields.password }
      : { email: fields.email, password: fields.password };
    const parsed = (registering ? registerSchema : loginSchema).safeParse(
      input,
    );
    const errors: Record<string, string> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        errors[issue.path.join('.')] ??= issue.message;
    if (registering && fields.password !== fields.confirmPassword)
      errors.confirmPassword = 'Passwords must match.';
    setValidation(errors);
    if (parsed.success && Object.keys(errors).length === 0)
      mutation.mutate(parsed.data);
  }
  return (
    <main id="main-content" tabIndex={-1} className="auth-page">
      <Link className="brand" to="/login">
        <span className="brand-mark" aria-hidden="true">
          D
        </span>
        DevTrack
      </Link>
      <div className="panel auth-panel">
        <p className="eyebrow">Your projects, in focus</p>
        <h1>{registering ? 'Create an account' : 'Welcome back'}</h1>
        <p className="muted">
          {registering
            ? 'A home for the work you want to build.'
            : 'Log in to pick up where you left off.'}
        </p>
        <form
          ref={formRef}
          noValidate
          onSubmit={submit}
          aria-busy={mutation.isPending}
        >
          {mutation.error && (
            <p role="alert" className="error" data-form-error tabIndex={-1}>
              {mutation.error.message}
            </p>
          )}
          {(['name', 'email', 'password', 'confirmPassword'] as const)
            .filter(
              (field) =>
                registering ||
                (field !== 'name' && field !== 'confirmPassword'),
            )
            .map((field) => (
              <div className="field" key={field}>
                <label htmlFor={`auth-${field}`}>
                  {field === 'confirmPassword'
                    ? 'Confirm password'
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={`auth-${field}`}
                  type={
                    field.toLowerCase().includes('password')
                      ? 'password'
                      : field === 'email'
                        ? 'email'
                        : 'text'
                  }
                  autoComplete={
                    field === 'name'
                      ? 'name'
                      : field === 'email'
                        ? 'email'
                        : registering
                          ? 'new-password'
                          : 'current-password'
                  }
                  required
                  maxLength={
                    field === 'email' ? 254 : field === 'name' ? 120 : 128
                  }
                  value={fields[field]}
                  disabled={mutation.isPending}
                  onChange={(event) =>
                    setFields({ ...fields, [field]: event.target.value })
                  }
                  aria-invalid={Boolean(details[field])}
                  aria-describedby={
                    details[field]
                      ? `${field}-error`
                      : field === 'password' && registering
                        ? 'password-help'
                        : undefined
                  }
                />
                {details[field] && (
                  <p id={`${field}-error`} role="alert" className="error">
                    {details[field]}
                  </p>
                )}
                {field === 'password' && registering && (
                  <p id="password-help" className="field-help">
                    Use 12–128 characters. Spaces and passphrases are welcome.
                  </p>
                )}
              </div>
            ))}
          <button
            type="submit"
            className="button primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? registering
                ? 'Creating account…'
                : 'Logging in…'
              : registering
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          {registering ? 'Already have an account?' : 'New to DevTrack?'}{' '}
          <Link to={registering ? '/login' : '/register'}>
            {registering ? 'Log in' : 'Create account'}
          </Link>
        </p>
      </div>
    </main>
  );
}
