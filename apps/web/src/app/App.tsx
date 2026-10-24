import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router';
import { ProjectDetailPage } from '../pages/ProjectDetailPage/ProjectDetailPage';
import {
  CreateProjectPage,
  EditProjectPage,
} from '../pages/ProjectFormPage/ProjectFormPage';
import { ProjectsPage } from '../pages/ProjectsPage/ProjectsPage';
import { useEffect, useLayoutEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthPage } from '../pages/AuthPage/AuthPage';
import {
  replaceSession,
  useCurrentUser,
  useLogout,
} from '../features/auth/hooks/useAuth';
import { QueryError } from '../components/ui/QueryError';
import { LoadingState } from '../components/ui/LoadingState';
import { DashboardPage } from '../pages/DashboardPage/DashboardPage';

function Layout() {
  const current = useCurrentUser();
  const logout = useLogout();
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
  if (!current.data) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/dashboard" className="brand">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          DevTrack
        </Link>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Main navigation">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </nav>
        <p className="sidebar-note">
          One project.
          <br />
          One step forward.
        </p>
      </aside>
      <div className="workspace">
        <div className="workspace-bar">
          <span>{current.data.name}’s workspace</span>
          <div className="account-actions">
            <span className="workspace-tag">{current.data.email}</span>
            <button
              className="button"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
        <main id="main-content" tabIndex={-1}>
          {logout.error && (
            <p role="alert" className="error">
              {logout.error.message}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export function App() {
  const client = useQueryClient();
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main?.contains(document.activeElement))
      main?.focus({ preventScroll: true });
  }, [pathname]);
  useLayoutEffect(() => {
    const expired = () => {
      void replaceSession(client, null);
    };
    window.addEventListener('devtrack:unauthorized', expired);
    return () => window.removeEventListener('devtrack:unauthorized', expired);
  }, [client]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Routes>
        <Route path="login" element={<AuthPage key="login" mode="login" />} />
        <Route
          path="register"
          element={<AuthPage key="register" mode="register" />}
        />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<CreateProjectPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route
            path="projects/:projectId/edit"
            element={<EditProjectPage />}
          />
          <Route
            path="*"
            element={
              <div className="panel">
                <h1>Page not found</h1>
                <Link to="/projects">Back to projects</Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
