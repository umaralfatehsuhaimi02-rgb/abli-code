import React, { useEffect, useState } from 'react';
import { api, CatalogResponse, getToken, setToken, UserProfile } from './lib/api';
import { LandingPage } from './pages/LandingPage';
import { WorkspaceApp } from './components/WorkspaceApp';
import { AuthModal } from './components/AuthModal';
import { OperatorModal } from './components/OperatorModal';
import { LegalPages } from './components/LegalPages';
import { CookieBanner } from './components/CookieBanner';

type RouteView = 'landing' | 'app' | 'terms' | 'privacy' | 'aup' | 'cookies';

function resolveRoute(): RouteView {
  const hash = window.location.hash.replace(/^#/, '');
  const path = window.location.pathname;
  const target = hash || path;
  if (target.startsWith('/app') || window.abliDesktop?.isDesktop) return 'app';
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
  const [authOpen, setAuthOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);

  const loadCatalog = () => api.getCatalog().then(setCatalog).catch(() => {});

  useEffect(() => {
    loadCatalog();
    if (getToken()) {
      api.getMe().then((r) => setUser(r.user)).catch(() => setToken(''));
    }

    // Handle Stripe Checkout return (?session_id=...)
    const searchStr = window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : window.location.search.replace(/^\?/, '');
    const stripeParams = new URLSearchParams(searchStr);
    const sessionId = stripeParams.get('session_id');
    if (sessionId && getToken()) {
      api.verifyStripeSession(sessionId).then((res) => {
        if (res.user) setUser(res.user);
        window.location.hash = '#/app';
        setRoute('app');
      }).catch(() => {});
    }

    // Handle Supabase OAuth callback hash fragment (#access_token=...)
    if (window.location.hash.includes('access_token=')) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, '').split('?')[0]);
      const accessToken = params.get('access_token');
      if (accessToken) {
        api.exchangeSupabaseToken(accessToken).then((res) => {
          setToken(res.token);
          setUser(res.user);
          window.location.hash = '#/app';
          setRoute('app');
        }).catch(() => {});
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

  if (!catalog) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050505', color: '#fff' }} className="mono">
        INITIALIZING ABLI CODE...
      </div>
    );
  }

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

      {route === 'app' && (
        <WorkspaceApp
          catalog={catalog}
          user={user}
          onUserChange={setUser}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenOperator={() => setOperatorOpen(true)}
          onGoLanding={() => navigate('landing')}
        />
      )}

      {(route === 'terms' || route === 'privacy' || route === 'aup' || route === 'cookies') && (
        <LegalPages
          section={route}
          contactEmail={catalog.contactEmail}
          onBack={() => navigate('landing')}
          onSwitch={(s) => navigate(s)}
        />
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={(u) => {
          setUser(u);
          navigate('app');
        }}
      />

      <OperatorModal
        open={operatorOpen}
        onClose={() => setOperatorOpen(false)}
        onSaved={() => loadCatalog()}
      />

      <CookieBanner
        forceOpen={cookieOpen}
        onCloseForce={() => setCookieOpen(false)}
        onOpenCookiePolicy={() => navigate('cookies')}
      />
    </>
  );
}
export default App;
