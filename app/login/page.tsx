import Link from "next/link";
import { LoginMethods } from "./login-methods";

export const metadata = {
  title: "AMC Study OS — 登录",
  description: "Sign in to the private AMC Study OS deployment with WorkBuddy email login.",
};

/**
 * The access gate.
 *
 * A public URL reached from an ordinary browser carries no platform identity, so
 * the app asks for an email once and verifies it through WorkBuddy's native auth.
 * The verified identity is bound server-side to the existing owner profile, so the
 * learner's own history is what appears after sign-in.
 */
export default function LoginPage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AMC</span>
          <div>
            <b>AMC Study OS</b>
            <small>Evidence-gated Learning Engine</small>
          </div>
        </div>
        <div className="top-status"><span>Private</span></div>
      </header>
      <div className="workspace">
        <section className="question-card" style={{ maxWidth: 560, margin: "6vh auto" }}>
          <p className="kicker">OWNER ACCESS</p>
          <h1 style={{ fontSize: 24, margin: "10px 0 6px" }}>登录</h1>
          <p>这是单用户私人学习站点。使用本地用户名与密码登录，登录状态保持约 30 天。题库、判分与既有学习记录不受影响。</p>
          <LoginMethods />
          <p className="muted" style={{ marginTop: 18 }}>
            题目、判分与既有学习进度不受本页影响。<Link href="/">返回首页</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
