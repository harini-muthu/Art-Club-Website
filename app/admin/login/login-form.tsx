"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError("That login did not work. Check the email and password.");
        return;
      }

      window.location.assign("/admin");
    } catch {
      setError("We could not sign you in right now. Try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        Password
        <input
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
