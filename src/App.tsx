import React, { useEffect, useState } from 'react';
import { api, CatalogResponse, getToken, setToken, UserProfile } from './lib/api';
import { LandingPage } from './pages/LandingPage';
import { WorkspaceApp } from './components/WorkspaceApp';
import { AuthModal } from './components/AuthModal';
import { LegalPages } from './components/LegalPages';
import { CookieBanner } from './components/CookieBanner';
import { AbliLogo } from './components/AbliLogo';
import { SignInScreen } from './components/SignInScreen';

type RouteView = 'landing' | 'app' | 'terms' | 'privacy' | 'aup' | 'cookies';

// The desktop app has no marketing site: it only ever shows the sign-in gate or the workspace.
const IS_DESKTOP = !!(window as any).abliDesktop?.isDesktop;
if (IS_DESKTOP) document.body.classList.add('is-desktop');

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
  const [authNotice, setAuthNotice] = useState('');
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

    // Supabase puts its result at the very end of the address, which can come after our own "#/app" part.
    const hashNow = window.location.hash;
    const tokenMatch = /[#&?]access_token=([^&]+)/.exec(hashNow);
    const problemMatch = /[#&?]error_description=([^&]+)/.exec(hashNow);
    if (problemMatch) {
      setAuthNotice(decodeURIComponent(problemMatch[1].replace(/\+/g, ' ')));
      setAuthOpen(true);
      window.location.hash = '#/app';
    } else if (tokenMatch) {
      const accessToken = decodeURIComponent(tokenMatch[1]);
      api
        .exchangeSupabaseToken(accessToken)
        .then((res) => {
          setToken(res.token);
          setUser(res.user);
          window.location.hash = '#/app';
          setRoute('app');
        })
        .catch((e) => {
          setAuthNotice((e && e.message) || 'Sign-in could not be completed. Try again.');
          window.location.hash = '#/app';
        });
    }

    const onHash = () => setRoute(resolveRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (to: RouteView) => {
    const next: RouteView = IS_DESKTOP && to === 'landing' ? 'app' : to;
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
          onBackLanding={() => navigate('landing')}
          onLogout={handleLogout}
        />
      )}

      {(route === 'terms' || route === 'privacy' || route === 'aup' || route === 'cookies') && (
        <LegalPages section={route} contactEmail={catalog.contactEmail} onBack={() => navigate('landing')} />
      )}

      {appRequiresLogin && (
        <SignInScreen onBack={IS_DESKTOP ? undefined : () => navigate('landing')}>
          <AuthModal
            inline
            open
            notice={authNotice}
            onClose={() => {}}
            onAuthed={(u) => {
              setUser(u);
              navigate('app');
            }}
          />
        </SignInScreen>
      )}

      <AuthModal
        open={authOpen && !appRequiresLogin}
        notice={authNotice}
        onClose={() => {
          setAuthOpen(false);
          if (appRequiresLogin) navigate('landing');
        }}
        onAuthed={(u) => {
          setUser(u);
          navigate('app');
        }}
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
