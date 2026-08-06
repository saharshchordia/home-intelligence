import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import "../../app/globals.css";
import { TwinDashboard } from "../../app/components/TwinDashboard";
import { baselineTwin } from "../../lib/twin-data";

const apiBaseUrl = import.meta.env.VITE_HOME_API_BASE_URL as string | undefined;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const supabase = useMemo(() => (
    supabaseUrl && supabasePublishableKey
      ? createClient(supabaseUrl, supabasePublishableKey)
      : null
  ), []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase || !apiBaseUrl) {
    return <TwinDashboard initialTwin={baselineTwin} mode="static" />;
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <span className="eyebrow">Home Intelligence</span>
          <h1>Sign in to your private home record</h1>
          <p>GitHub Pages hosts the interface. Supabase protects the database, evidence files, zones, pins, and history updates.</p>
          <form onSubmit={async (event) => {
            event.preventDefault();
            setNotice(null);
            const { error } = await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: window.location.origin + window.location.pathname },
            });
            setNotice(error ? error.message : "Check your email for a sign-in link.");
          }}>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <button className="primary-button">Send sign-in link</button>
          </form>
          {notice && <p className="form-error">{notice}</p>}
        </section>
      </main>
    );
  }

  return (
    <TwinDashboard
      initialTwin={baselineTwin}
      mode="static"
      apiBaseUrl={apiBaseUrl}
      apiToken={session.access_token}
    />
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
);
