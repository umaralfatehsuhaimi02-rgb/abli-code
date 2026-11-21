import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AbliLogo } from './AbliLogo';

type Section = 'terms' | 'privacy' | 'aup' | 'cookies';
type Block = { h: string; p: string[] };
type Doc = { title: string; intro: string; blocks: Block[] };

const UPDATED = 'November 21, 2026';

function buildDocs(email: string): Record<Section, Doc> {
  return {
    terms: {
      title: 'Terms of Service',
      intro: `These Terms of Service (the "Terms") are an agreement between you and Abli Code, operated by Umar Al-Fateh Suhaimi ("Abli Code", "we", "us"). They apply to the Abli Code website, desktop application, and related services (the "Service"). By creating an account or using the Service you agree to these Terms. If you do not agree, do not use the Service.`,
      blocks: [
        {
          h: '1. What Abli Code is',
          p: [
            `Abli Code is a workspace for chatting with and working alongside AI language models, including abliterated models. An abliterated model is an open-weight model that has been modified to reduce or remove its built-in refusal behavior. Abli Code does not train these models. It sends your prompts to third-party model providers and shows you the responses.`,
            `The Service also lets you connect Model Context Protocol (MCP) servers and, if you turn it on, let a model run commands and edit files on your own computer ("computer control").`
          ]
        },
        {
          h: '2. Eligibility and accounts',
          p: [
            `You must be at least 18 years old and able to form a binding contract to use the Service. You may not use the Service if you are barred from doing so under the laws that apply to you.`,
            `You are responsible for your account, for keeping your password and sign-in methods secure, and for everything that happens under your account. Give us accurate information and tell us at ${email} if you think your account has been compromised. One person may not run multiple accounts to get around usage limits.`
          ]
        },
        {
          h: '3. Abliterated models: what you need to understand',
          p: [
            `Abliterated models can produce content that mainstream models would refuse. Their output may be inaccurate, offensive, unsafe, or unsuitable for your purpose. Output is generated automatically and is not reviewed by us.`,
            `You are solely responsible for the prompts you send, how you use the output, and any consequences of that use. Do not rely on output as legal, medical, financial, security, or other professional advice, and verify anything important before you act on it.`,
            `Your use of the Service must comply with the Acceptable Use Policy and with all laws that apply to you. Removing a model's refusals does not make any use of it lawful.`
          ]
        },
        {
          h: '4. Computer control and MCP servers',
          p: [
            `Computer control and MCP servers are off by default. When you enable them for a thread, you authorize the model to take actions on your device or through the connected server, including running commands, reading and writing files, and capturing your screen. Those actions run with your device permissions and can change or delete data.`,
            `Review what a model proposes to do, use test folders or a virtual machine for anything risky, and keep backups. You are responsible for every action taken through computer control and for the MCP servers you add. We are not responsible for loss of data or damage to your device or systems.`
          ]
        },
        {
          h: '5. Third-party providers',
          p: [
            `The Service depends on third parties, including model providers, Supabase (authentication and database), Stripe (payments), and email delivery services. Your prompts and any content you attach are sent to the model provider that serves the model you choose. Each provider handles that data under its own terms and privacy policy, and we do not control their retention or practices.`,
            `Providers can change or withdraw models, prices, or availability at any time. We may add, change, or remove models and providers without notice, and we do not guarantee that any particular model will remain available.`
          ]
        },
        {
          h: '6. Plans, credits, and fair use',
          p: [
            `Some models are free up to a daily token limit shown in the app. Daily limits reset at 00:00 UTC. Paid plans (Plus, Pro, Max) are billed monthly in advance through Stripe and renew automatically until you cancel. Cancel any time from your billing portal; cancellation takes effect at the end of the current billing period.`,
            `Credits can be added from $5. A service fee (currently 5% of the amount, with a minimum of $0.80) is added to the price and shown before you pay. Credits are used to pay for model usage beyond your plan and are priced per token as displayed in the app.`,
            `Plans include a usage allowance. We apply fair-use limits to protect the Service, and usage may be paused until your next billing cycle or until you add credits or upgrade once the allowance for your plan has been used. We may change prices, limits, or plan features on reasonable notice. Changes apply from your next billing period.`,
            `Except where the law gives you a right to a refund, payments and credits are non-refundable and credits have no cash value. Credits may expire if your account is closed for breach of these Terms. Taxes may be added where required.`
          ]
        },
        {
          h: '7. Your content and our rights',
          p: [
            `You keep ownership of the prompts, files, and other content you submit ("Your Content"). You give us a limited license to store, process, and transmit Your Content, including to the model providers you choose, only as needed to operate and secure the Service and to provide it to you.`,
            `As between you and us, and to the extent the law allows, you own the output generated for you. Output may not be unique, and similar output may be generated for others. We make no promise that output is free of third-party rights.`,
            `We and our licensors own the Service, including its design, branding, and software, except for components licensed to us under open-source licenses, which remain under those licenses. These Terms do not transfer any of our intellectual property to you.`
          ]
        },
        {
          h: '8. Acceptable use',
          p: [
            `You must follow the Acceptable Use Policy. We may investigate suspected violations, remove content, limit or suspend accounts, and report unlawful activity to the authorities.`
          ]
        },
        {
          h: '9. Suspension and termination',
          p: [
            `You can stop using the Service and delete your account at any time by emailing ${email}. We may suspend or end your access immediately if you breach these Terms, if we must do so to comply with law or provider rules, if your use creates risk or cost for us or others, or if we stop offering the Service. If we end your paid plan without cause, we will refund the unused part of the current billing period.`
          ]
        },
        {
          h: '10. Disclaimers',
          p: [
            `The Service is provided "as is" and "as available". To the fullest extent the law allows, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, accuracy, non-infringement, and uninterrupted or error-free operation. We do not warrant that output is correct, safe, or lawful to use.`
          ]
        },
        {
          h: '11. Limitation of liability',
          p: [
            `To the fullest extent the law allows, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or business interruption, arising from your use of the Service, including output from models and actions taken through computer control or MCP servers.`,
            `Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim arose and US $50. Nothing in these Terms limits liability that cannot be limited by law, such as liability for fraud or for death or personal injury caused by negligence.`
          ]
        },
        {
          h: '12. Indemnity',
          p: [
            `You agree to defend and indemnify us against claims, losses, and costs (including reasonable legal fees) arising from Your Content, your use of output, your breach of these Terms or the Acceptable Use Policy, or your violation of any law or third-party right.`
          ]
        },
        {
          h: '13. Copyright complaints',
          p: [
            `If you believe content on the Service infringes your copyright, email ${email} with your contact details, a description of the work, where the content is, and a statement that you are authorized to act. We will review and act on valid notices.`
          ]
        },
        {
          h: '14. Changes to these Terms',
          p: [
            `We may update these Terms. If a change is material, we will give notice in the app or by email before it takes effect. Continuing to use the Service after the effective date means you accept the updated Terms.`
          ]
        },
        {
          h: '15. Governing law and disputes',
          p: [
            `These Terms are governed by the laws of Malaysia, without regard to conflict-of-law rules. The courts of Malaysia have exclusive jurisdiction over disputes, except that mandatory consumer protection laws in your country of residence continue to apply to you. Before filing a claim, please contact us at ${email} so we can try to resolve it informally.`
          ]
        },
        {
          h: '16. General',
          p: [
            `These Terms, together with the Privacy Policy, Acceptable Use Policy, and Cookie Policy, are the entire agreement between us about the Service. If a provision is unenforceable, the rest remains in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a sale or reorganization. Contact: ${email}.`
          ]
        }
      ]
    },

    privacy: {
      title: 'Privacy Policy',
      intro: `This Privacy Policy explains what personal data Abli Code, operated by Umar Al-Fateh Suhaimi, collects, how we use it, who we share it with, and the choices you have. For privacy questions, contact ${email}.`,
      blocks: [
        {
          h: '1. Data we collect',
          p: [
            `- Account data: your email address, name, profile picture (if you sign in with GitHub or Google), and a password hash if you sign up with email. We never see your GitHub or Google password.`,
            `- Verification data: one-time sign-up codes, stored as hashes with an expiry.`,
            `- Content: the threads, prompts, files you attach, and model responses, and your connected MCP server settings.`,
            `- Usage and billing data: which models you use, token counts, costs, plan, credit balance, and payment status. Stripe handles card details; we do not receive or store full card numbers.`,
            `- Technical data: IP address, browser or app version, and server logs created when you use the Service.`,
            `- Local device data: if you turn on computer control, commands and file contents you or the model choose to send are processed on your device and are sent to us and to your selected model provider only as part of a prompt you submit.`
          ]
        },
        {
          h: '2. How we use data',
          p: [
            `We use data to create and secure your account, run the Service, send your prompts to the model you chose and return the output, meter usage and enforce limits, process payments and credits, send verification codes and service messages, prevent abuse and fraud, comply with law, and fix and improve the Service. We do not sell your personal data and we do not use your content to train our own models.`,
            `Where the law requires a legal basis, we rely on performing our contract with you, our legitimate interests in running and securing the Service, your consent where we ask for it, and compliance with legal obligations.`
          ]
        },
        {
          h: '3. Who we share data with',
          p: [
            `- Model providers: your prompts and attached content go to the provider that serves the model you pick (for example AbliteratedLLM, UNST33R, or UplinkSwitch). They process it under their own terms and privacy policies, and may retain it. Choose a model with that in mind and do not send content you are not allowed to share.`,
            `- Supabase: authentication and database hosting.`,
            `- Stripe: payment processing and billing portal.`,
            `- Email delivery services: to send verification codes and service emails.`,
            `- Authorities and advisers: where required by law or to protect rights, safety, and the Service, and to professional advisers under confidentiality.`,
            `- Successors: if we sell or reorganize the Service, data may transfer to the new owner under this policy.`
          ]
        },
        {
          h: '4. International transfers',
          p: [
            `Our providers operate in several countries, including Malaysia, South Korea, and the United States, and in any other country where a model provider operates. By using the Service you understand your data may be processed outside your country. Where required, we rely on appropriate safeguards for those transfers.`
          ]
        },
        {
          h: '5. Retention',
          p: [
            `We keep account, content, and usage data while your account is active. When you ask us to delete your account we delete or anonymize your personal data within 30 days, except where we must keep records for legal, tax, fraud-prevention, or dispute reasons (for example payment records). Backups are overwritten on their normal cycle. Model providers keep data under their own retention rules.`
          ]
        },
        {
          h: '6. Your rights',
          p: [
            `Depending on where you live (including under Malaysia's Personal Data Protection Act 2010, the EU and UK GDPR, and similar laws), you may have the right to access, correct, delete, or export your personal data, to object to or restrict certain processing, to withdraw consent, and to complain to your data protection authority. Email ${email} to exercise these rights. We may need to verify your identity first.`
          ]
        },
        {
          h: '7. Security',
          p: [
            `We use access controls, row-level security on our database, hashed passwords and codes, and encrypted connections. No system is perfectly secure, so we cannot guarantee absolute security. Keep your sign-in details safe and tell us about any suspected breach.`
          ]
        },
        {
          h: '8. Children',
          p: [
            `The Service is for people 18 and over. We do not knowingly collect data from anyone under 18. If you believe a child has given us data, email ${email} and we will delete it.`
          ]
        },
        {
          h: '9. Cookies and similar technologies',
          p: [
            `See the Cookie Policy for details on the cookies and local storage we use and how to control them.`
          ]
        },
        {
          h: '10. Changes to this policy',
          p: [
            `We may update this policy. We will post the new version with a new date and, for material changes, tell you in the app or by email.`
          ]
        },
        {
          h: '11. Contact',
          p: [`Questions or requests: ${email}.`]
        }
      ]
    },

    aup: {
      title: 'Acceptable Use Policy',
      intro: `This policy sets out what you may and may not do with Abli Code. It is part of the Terms of Service. Because abliterated models answer requests other models refuse, these rules matter, and we enforce them.`,
      blocks: [
        {
          h: '1. You may not use the Service to',
          p: [
            `- Break any law or help anyone else break the law.`,
            `- Create, request, or distribute sexual content involving minors, in any form. This is prohibited absolutely and we report it to the authorities.`,
            `- Create, improve, or deploy malware, ransomware, spyware, or other code intended to damage systems or steal data, or attack, scan, or gain access to systems, accounts, or networks you do not own or do not have written permission to test.`,
            `- Commit fraud, run scams or phishing, impersonate people or organizations to deceive, or create fake reviews, documents, or identities.`,
            `- Threaten, harass, stalk, or incite violence against any person or group, or produce content that promotes terrorism.`,
            `- Obtain or give instructions for making weapons capable of mass harm, or for seriously harming yourself or others.`,
            `- Collect, expose, or misuse other people's personal data (doxxing), or create intimate imagery of real people without their consent.`,
            `- Infringe intellectual property rights or violate other people's privacy or publicity rights.`
          ]
        },
        {
          h: '2. Protect the Service and other users',
          p: [
            `- Do not bypass, probe, or overload usage limits, authentication, or security, and do not use more than one account to get extra free usage.`,
            `- Do not share, sell, or resell access to your account or to the Service, or extract provider keys or credentials.`,
            `- Do not run automated or abusive traffic against the Service.`,
            `- Do not use the Service to build or train a competing model from its output where that is prohibited by the model provider's terms.`
          ]
        },
        {
          h: '3. What is allowed',
          p: [
            `Security research and reverse engineering on software and systems you own or are authorized to test, defensive analysis of suspicious files in an isolated environment, fiction and creative writing, and frank discussion of sensitive topics are allowed, as long as you stay within the law and the rules above.`
          ]
        },
        {
          h: '4. Enforcement',
          p: [
            `We may remove content, limit features, suspend or close accounts, withhold refunds for abusive accounts, and report conduct to law enforcement, with or without notice, depending on the seriousness of the breach. Report abuse or ask questions at ${email}.`
          ]
        }
      ]
    },

    cookies: {
      title: 'Cookie Policy',
      intro: `This policy explains the cookies and similar technologies Abli Code uses. We keep them to a minimum and do not use advertising or cross-site tracking cookies.`,
      blocks: [
        {
          h: '1. What we store on your device',
          p: [
            `- Session token (local storage): keeps you signed in. Strictly necessary. Removed when you sign out.`,
            `- Cookie preference (local storage): remembers the choice you made in the cookie banner. Strictly necessary.`,
            `- App settings (local storage): remembers choices like your selected model and sidebar state.`
          ]
        },
        {
          h: '2. Third parties',
          p: [
            `- Google Fonts: the website loads fonts from Google, which means your IP address and browser details are sent to Google when the page loads.`,
            `- Sign-in providers (GitHub, Google) and Stripe: when you sign in or pay, these services set their own cookies on their own domains, under their own policies.`
          ]
        },
        {
          h: '3. Desktop app',
          p: [
            `By downloading and installing the Abli Code desktop app you accept the essential local storage listed above (your session token and basic settings). The desktop app therefore does not show a cookie banner. It does not use advertising or tracking storage.`
          ]
        },
        {
          h: '4. Your choices',
          p: [
            `You can change your preference at any time with "Cookie settings" in the footer, and you can clear local storage or cookies in your browser settings. Blocking strictly necessary storage will stop sign-in from working.`
          ]
        },
        {
          h: '5. Contact',
          p: [`Questions about this policy: ${email}.`]
        }
      ]
    }
  };
}

const TABS: { id: Section; label: string }[] = [
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'aup', label: 'Acceptable use' },
  { id: 'cookies', label: 'Cookies' }
];

export function LegalPages({ section, contactEmail, onBack }: { section: Section; contactEmail: string; onBack: () => void }) {
  const docs = buildDocs(contactEmail);
  const doc = docs[section];
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const go = (id: Section) => {
    window.location.hash = `#/legal/${id}`;
    window.scrollTo({ top: 0 });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fafafa' }}>
      <header style={{ maxWidth: 860, margin: '0 auto', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
          <AbliLogo size={28} /> Abli Code
        </div>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#fafafa', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '9px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          <ArrowLeft size={15} /> Back
        </button>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 90px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => go(t.id)} style={{ borderRadius: 999, padding: '9px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', border: '1.5px solid ' + (t.id === section ? '#ff2a43' : 'rgba(255,255,255,0.2)'), background: t.id === section ? '#ff2a43' : 'transparent', color: '#fff' }}>{t.label}</button>
          ))}
        </div>

        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 8px' }}>{doc.title}</h1>
        <p style={{ color: '#8e8e9c', fontSize: 14, margin: '0 0 22px' }}>Last updated {UPDATED}</p>
        <p style={{ fontSize: 16.5, lineHeight: 1.75, color: '#d4d4de', margin: '0 0 36px' }}>{doc.intro}</p>

        <nav style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 24px', marginBottom: 44 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8e8e9c', marginBottom: 10 }}>On this page</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {doc.blocks.map((b) => (
              <a key={b.h} href={`#${slug(b.h)}`} onClick={(e) => { e.preventDefault(); document.getElementById(slug(b.h))?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: '#c4c4d0', fontSize: 14.5, textDecoration: 'none' }}>{b.h}</a>
            ))}
          </div>
        </nav>

        {doc.blocks.map((b) => (
          <section key={b.h} id={slug(b.h)} style={{ marginBottom: 38, scrollMarginTop: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 14px' }}>{b.h}</h2>
            {b.p.map((para, i) =>
              para.startsWith('- ') ? (
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 15.5, lineHeight: 1.7, color: '#c4c4d0', margin: '0 0 9px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff2a43', marginTop: 10, flexShrink: 0 }} />
                  <span>{para.slice(2)}</span>
                </div>
              ) : (
                <p key={i} style={{ fontSize: 15.5, lineHeight: 1.75, color: '#c4c4d0', margin: '0 0 14px' }}>{para}</p>
              )
            )}
          </section>
        ))}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 24, fontSize: 14, color: '#8e8e9c' }}>
          Questions? Email <a href={`mailto:${contactEmail}`} style={{ color: '#fafafa' }}>{contactEmail}</a>.
        </div>
      </main>
    </div>
  );
}
