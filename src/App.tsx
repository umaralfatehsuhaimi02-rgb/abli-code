import React, { useEffect, useState } from 'react';
import { api, CatalogResponse, getToken, setToken, UserProfile } from './lib/api';
import { LandingPage } from './pages/LandingPage';
import { WorkspaceApp } from './components/WorkspaceApp';
import { AuthModal } from './components/AuthModal';
import { OperatorModal } from './components/OperatorModal';
import { LegalPages } from './components/LegalPages';
import { CookieBanner } from './components/CookieBanner';
import { AbliLogo } from './components/AbliLogo';

type RouteView = 'landing' | 'app' | 'terms' | 'privacy' | 'aup' | 'cookies';

function resolveRoute(): RouteView {
  const hash = window.location.hash.replace(/^#/, '');
  const path = window.location.pathname;
  const target = hash || path;
  if (target.startsWith('/app') || (window as any).abliDesktop?.isDesktop) return 'app';
  if (target.includes('/legal/terms')) return 'terms';
  if (target.includes('/legal/privacy')) return 'privacy';
  if (target.includes('/legal/aup')) return 'aup';
  if (target.includes('/legal/cookies')) return 'cookies';
  return 'landing';
}

export function App() {
  const [route, setRoute] = useState<RouteView>(resolveRoute);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);

  const loadCatalog = () => api.getCatalog().then(setCatalog).catch(() => {});

  useEffect(() => {
    loadCatalog();
    if (getToken()) {
      api
        .getMe()
        .then((r) => setUser(r.user))
        .catch(() => setToken(''))
        .finally(() => setSessionChecked(true));
    } else {
      setSessionChecked(true);
    }

    const searchStr = window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : window.location.search.replace(/^\?/, '');
    const sessionId = new URLSearchParams(searchStr).get('session_id');
    if (sessionId && getToken()) {
      api
        .verifyStripeSession(sessionId)
        .then((res) => {
          if (res.user) setUser(res.user);
          window.location.hash = '#/app';
          setRoute('app');
        })
        .catch(() => {});
    }

    if (window.location.hash.includes('access_token=')) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, '').split('?')[0]);
      const accessToken = params.get('access_token');
      if (accessToken) {
        api
          .exchangeSupabaseToken(accessToken)
          .then((res) => {
            setToken(res.token);
            setUser(res.user);
            window.location.hash = '#/app';
            setRoute('app');
          })
          .catch(() => {});
      }
    }

    const onHash = () => setRoute(resolveRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (next: RouteView) => {
    setRoute(next);
    if (next === 'landing') window.location.hash = '#/';
    else if (next === 'app') window.location.hash = '#/app';
    else window.location.hash = `#/legal/${next}`;
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setToken('');
    setUser(null);
    navigate('landing');
  };

  if (!catalog || !sessionChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#060608', color: '#fafafa' }}>
        <AbliLogo size={44} />
      </div>
    );
  }

  const appRequiresLogin = route === 'app' && !user;

  return (
    <>
      {route === 'landing' && (
        <LandingPage
          catalog={catalog}
          user={user}
          onLaunchApp={() => navigate('app')}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenOperator={() => setOperatorOpen(true)}
          onOpenLegal={(s) => navigate(s)}
          onOpenCookiePrefs={() => setCookieOpen(true)}
        />
      )}

      {route === 'app' && user && (
        <WorkspaceApp
          catalog={catalog}
          user={user}
          onUserChange={setUser}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenOperator={() => setOperatorOpen(true)}
          onBackLanding={() => navigate('landing')}
          onLogout={handleLogout}
        />
      )}

      {(route === 'terms' || route === 'privacy' || route === 'aup' || route === 'cookies') && (
        <LegalPages section={route} contactEmail={catalog.contactEmail} onBack={() => navigate('landing')} />
      )}

      {appRequiresLogin && (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#060608' }}>
          <div style={{ color: '#8e8e9c', fontSize: 14 }}>Sign in to open Abli Code.</div>
        </div>
      )}

      <AuthModal
        open={authOpen || appRequiresLogin}
        onClose={() => {
          setAuthOpen(false);
          if (appRequiresLogin) navigate('landing');
        }}
        onAuthed={(u) => {
          setUser(u);
          navigate('app');
        }}
      />

      <OperatorModal open={operatorOpen} onClose={() => setOperatorOpen(false)} onSaved={() => loadCatalog()} />

      <CookieBanner
        forceOpen={cookieOpen}
        onCloseForce={() => setCookieOpen(false)}
        onOpenCookiePolicy={() => navigate('cookies')}
      />
    </>
  );
}
export default App;
