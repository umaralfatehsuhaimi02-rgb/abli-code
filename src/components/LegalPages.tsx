import React from 'react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

export function LegalPages({
  section,
  contactEmail,
  onBack
}: {
  section: 'terms' | 'privacy' | 'aup' | 'cookies';
  contactEmail: string;
  onBack: () => void;
}) {
  const titles = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    aup: 'Acceptable Use Policy',
    cookies: 'Cookie Policy'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fafafa', padding: '48px 20px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <button onClick={onBack} className="btn-outline" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to Abli Code
        </button>

        <div style={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ff2a43', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            <ShieldCheck size={15} /> Legal &amp; Compliance
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.025em' }}>{titles[section]}</h1>
          <p style={{ color: '#8e8e9c', fontSize: 13, margin: '0 0 28px' }}>
            Effective November 21, 2026 · Operator Contact:{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#ff6b7d', textDecoration: 'underline' }}>{contactEmail}</a>
          </p>

          {section === 'terms' && (
            <div style={{ display: 'grid', gap: 18, lineHeight: 1.7, color: '#d4d4de', fontSize: 14.5 }}>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>1. Service &amp; Open-Source License</h3>
                <p style={{ margin: 0 }}>
                  Abli Code is open-source software released under the MIT License. Hosted access is provided "AS IS" without warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.
                </p>
              </section>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>2. Usage Quotas &amp; Subscriptions</h3>
                <p style={{ margin: 0 }}>
                  Free models include daily token quotas per model (750,000 tokens/day UTC per free model). Paid plans (Plus at $20/mo, Pro at $50/mo, Max at $100/mo) include monthly usage allowances enforced automatically to prevent overages. Credit top-ups extend usage beyond plan limits.
                </p>
              </section>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>3. User Responsibility &amp; Indemnification</h3>
                <p style={{ margin: 0 }}>
                  You are solely responsible for prompts, code, connected MCP tools, and actions executed on your machine. You agree to indemnify and hold harmless the Abli Code maintainers from any claims arising from misuse, unlawful automation, or third-party intellectual property disputes.
                </p>
              </section>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>4. Limitation of Liability</h3>
                <p style={{ margin: 0 }}>
                  To the maximum extent permitted by law, total aggregate liability shall not exceed the fees you paid to Abli Code during the three (3) months preceding the claim.
                </p>
              </section>
            </div>
          )}

          {section === 'privacy' && (
            <div style={{ display: 'grid', gap: 18, lineHeight: 1.7, color: '#d4d4de', fontSize: 14.5 }}>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>1. Data We Collect</h3>
                <p style={{ margin: 0 }}>
                  We store account identity (email, display name, auth provider via Supabase), subscription plan, credit balances, and aggregated token usage counts. Prompts are forwarded directly to your configured AI model providers and are not sold.
                </p>
              </section>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>2. Deletion &amp; Data Requests</h3>
                <p style={{ margin: 0 }}>
                  Email <a href={`mailto:${contactEmail}`} style={{ color: '#ff6b7d' }}>{contactEmail}</a> to export or permanently delete your account and associated records.
                </p>
              </section>
            </div>
          )}

          {section === 'aup' && (
            <div style={{ display: 'grid', gap: 18, lineHeight: 1.7, color: '#d4d4de', fontSize: 14.5 }}>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>1. Authorized Environments Only</h3>
                <p style={{ margin: 0 }}>
                  You may only run Abli Code desktop automation and workspace tools on codebases, files, and systems you own or have explicit written authorization to work on.
                </p>
              </section>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>2. Prohibited Conduct</h3>
                <p style={{ margin: 0 }}>
                  Using Abli Code for malware distribution, unauthorized network intrusion, credential theft, denial-of-service, or illegal content results in immediate account termination.
                </p>
              </section>
            </div>
          )}

          {section === 'cookies' && (
            <div style={{ display: 'grid', gap: 18, lineHeight: 1.7, color: '#d4d4de', fontSize: 14.5 }}>
              <section>
                <h3 style={{ color: '#fff', margin: '0 0 6px' }}>1. Essential &amp; Preference Storage</h3>
                <p style={{ margin: 0 }}>
                  Abli Code uses strictly necessary cookies and localStorage entries to keep you signed in, remember your cookie consent choice, and save active thread preferences.
                </p>
              </section>
            </div>
          )}

          <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#8e8e9c' }}>Questions or legal notices?</span>
            <a href={`mailto:${contactEmail}`} className="btn-red" style={{ padding: '9px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Mail size={14} /> Contact {contactEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
