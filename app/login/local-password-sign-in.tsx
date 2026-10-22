"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Local username + password login.
 *
 * This is the only normal login route for the site: a private single-owner study
 * tool has no use for third-party identity. The password is posted once, verified
 * server-side against a salted KDF hash, and exchanged for an HttpOnly session
 * cookie; nothing about it is kept in the browser.
 *
 * When the visitor already holds a valid session but no local credential exists
 * yet, the same component offers the one-time setup instead. That ordering is what
 * keeps the site safe — the credential can only be created from an authenticated
 * session, never by whoever happens to open the page first.
 */
export function LocalPasswordSignIn() {
  const [mode, setMode] = useState<"loading" | "login" | "setup">("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ authenticated?: boolean; localPasswordConfigured?: boolean }>)
      .then((body) => {
        if (cancelled) return;
        setMode(body?.authenticated && !body?.localPasswordConfigured ? "setup" : "login");
      })
      .catch(() => { if (!cancelled) setMode("login"); });
    return () => { cancelled = true; };
  }, []);

  function goHome() {
    const target = new URLSearchParams(window.location.search).get("return_to");
    window.location.assign(target && target.startsWith("/") && !target.startsWith("//") ? target : "/");
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !username.trim() || !password) return;
    setBusy(true);
    setMessage("");
    setOk(false);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const body: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error || "登录失败，请重试。");
        return;
      }
      goHome();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  async function setup(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(username.trim())) {
      setMessage("用户名需为 3-32 位字母、数字、点、下划线或短横线。");
      return;
    }
    if (password.length < 10) {
      setMessage("密码至少 10 位。");
      return;
    }
    if (password !== confirm) {
      setMessage("两次输入的密码不一致。");
      return;
    }
    setBusy(true);
    setMessage("");
    setOk(false);
    try {
      const response = await fetch("/api/session", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const body: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error || "设置失败，请重试。");
        return;
      }
      setOk(true);
      setMessage("已设置。下次可直接用用户名与密码登录。");
      setMode("login");
      setPassword("");
      setConfirm("");
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "loading") {
    return <p className="muted" style={{ marginTop: 18 }}>正在检查登录状态…</p>;
  }

  const inputStyle = { border: "1px solid #cdd9e3", borderRadius: 9, padding: "10px 12px", fontSize: 15, color: "#17253d" } as const;

  return (
    <form onSubmit={mode === "setup" ? setup : signIn} style={{ display: "grid", gap: 12, marginTop: 18 }}>
      {mode === "setup" && (
        <p className="muted" style={{ margin: 0 }}>
          你当前已登录。请设置一次本地用户名与密码，之后登录只需用户名 + 密码，不再使用邮箱、微信或云身份。
        </p>
      )}
      <label htmlFor="owner-username" style={{ fontSize: 13, color: "#475569" }}>用户名</label>
      <input
        id="owner-username"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        autoFocus
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        style={inputStyle}
      />
      <label htmlFor="owner-password-field" style={{ fontSize: 13, color: "#475569" }}>密码</label>
      <input
        id="owner-password-field"
        type="password"
        autoComplete={mode === "setup" ? "new-password" : "current-password"}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        style={inputStyle}
      />
      {mode === "setup" && (
        <>
          <label htmlFor="owner-password-confirm" style={{ fontSize: 13, color: "#475569" }}>确认密码</label>
          <input
            id="owner-password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            style={inputStyle}
          />
        </>
      )}
      <Button type="submit" size="lg" disabled={busy || !username.trim() || !password}>
        {busy ? (mode === "setup" ? "正在设置…" : "正在登录…") : mode === "setup" ? "设置用户名与密码" : "登录"}
      </Button>
      {message && <p className={ok ? "muted" : "translation-error"} role="alert">{message}</p>}
    </form>
  );
}
