import { Link } from "react-router-dom";
import { Page, Card, Section } from "./ui";
import {
  CalendarRange, Repeat, Gauge, Mail, Zap, Smartphone, ShieldCheck, Github,
} from "lucide-react";

const FEATURES = [
  { icon: CalendarRange, title: "Salary-to-salary budgeting", text: "Your dashboard, calendar and daily budget follow your pay cycle, not the calendar month." },
  { icon: Repeat, title: "Recurring bills & income", text: "Rent, EMIs and subscriptions are added automatically on their day, with upcoming bills shown before and after salary." },
  { icon: Gauge, title: "Category limits", text: "Set a limit per category for each pay cycle and get a warning at 80%." },
  { icon: Mail, title: "Auto-import from bank emails", text: "A small script in your own Gmail adds bank alerts as transactions, each one only once." },
  { icon: Zap, title: "Quick add", text: "The + button adds a transaction in a couple of taps, with one-tap buttons for things you log often." },
  { icon: Smartphone, title: "Works like an app", text: "On iPhone, open the site in Safari → Share → Add to Home Screen." },
];

const PRIVACY = [
  "Passwords are stored as bcrypt hashes, never in plain text.",
  "Your auto-import key is stored only as a SHA-256 hash, and you can turn it off at any time.",
  "Data is sent over HTTPS and stored in a PostgreSQL database.",
  "Your transactions are only visible to your account.",
];

function About() {
  const loggedIn = Boolean(localStorage.getItem("token"));
  return (
    <Page>
      <div className="flex items-center gap-4 mb-5">
        <span className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-2xl font-bold text-white">₹</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FinTrack</h1>
          <p className="text-ink-3">Personal finance, salary to salary.</p>
        </div>
      </div>
      <p className="text-[17px] text-ink-2 leading-relaxed">
        FinTrack helps you see where your money goes between paydays: what you&apos;ve spent,
        what&apos;s still due before your next salary, and how much you can safely spend each day.
      </p>

      <Section title="What it does">
        <Card className="divide-y divide-line/60 overflow-hidden">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3.5 px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <Icon className="w-[18px] h-[18px] text-ink-2" />
              </div>
              <div>
                <p className="text-[15px] font-semibold">{title}</p>
                <p className="text-sm text-ink-3 leading-relaxed mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Your data">
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <ShieldCheck className="w-5 h-5 text-pos" />
            <p className="text-[15px] font-semibold">How your data is handled</p>
          </div>
          <ul className="space-y-2 text-sm text-ink-2 list-disc pl-5">
            {PRIVACY.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <p className="text-[13px] text-ink-3 mt-4">
            FinTrack is a personal project, not a bank or a regulated financial service.
          </p>
        </Card>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-10 text-sm text-ink-3">
        <p>© {new Date().getFullYear()} FinTrack</p>
        <div className="flex gap-5">
          <Link to={loggedIn ? "/" : "/login"} className="hover:text-ink">{loggedIn ? "Home" : "Sign in"}</Link>
          <a href="https://github.com/MdAyanBadar/finTrack" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
            <Github className="w-4 h-4" /> Source code
          </a>
        </div>
      </div>
    </Page>
  );
}

export default About;
