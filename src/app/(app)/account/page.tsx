"use client";

import { useRouter } from "next/navigation";
import { ArrowCounterClockwise, DownloadSimple, SignOut } from "@phosphor-icons/react";
import { useState } from "react";
import { useMe, useStore } from "@/lib/store";
import { cn } from "@/lib/logic";
import { setTheme, themePreference } from "@/lib/theme";
import { Avatar, Button, Field, PageHeader, Panel, Segmented, Switch, inputClass } from "@/components/ui";
import { toast } from "@/lib/toast";
import { loadNotify, saveNotify, type NotifyPrefs } from "@/lib/prefs";

const notifyRows: { id: keyof NotifyPrefs; label: string; hint: string }[] = [
  { id: "grades", label: "Grades posted", hint: "When a score or comment is added to your work." },
  { id: "announcements", label: "Announcements", hint: "New posts from your instructors." },
  { id: "replies", label: "Discussion replies", hint: "Replies to your posts." },
  { id: "due", label: "Due date reminders", hint: "A nudge the day before something is due." },
  { id: "messages", label: "Inbox messages", hint: "New conversations and replies." },
];

export default function AccountPage() {
  const me = useMe()!;
  const data = useStore((s) => s.data);
  const update = useStore((s) => s.updateProfile);
  const signOut = useStore((s) => s.signOut);
  const reset = useStore((s) => s.resetDemo);
  const router = useRouter();
  const [name, setName] = useState(me.name);
  const [pronouns, setPronouns] = useState(me.pronouns ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [pref, setPref] = useState(themePreference);
  const [notify, setNotify] = useState(loadNotify);
  const dirty = name !== me.name || pronouns !== (me.pronouns ?? "") || bio !== (me.bio ?? "");

  const setN = (id: keyof NotifyPrefs, v: boolean) => {
    const next = { ...notify, [id]: v };
    setNotify(next);
    saveNotify(next);
  };

  const exportData = () => {
    const mine = {
      profile: me,
      submissions: data.submissions.filter((s) => s.userId === me.id),
      quizAttempts: data.attempts.filter((a) => a.userId === me.id),
      conversations: data.conversations.filter((c) => c.participantIds.includes(me.id)),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(mine, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "muselearning-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader title="Account" sub="Your profile, preferences and data." />
      <div className="flex flex-col gap-6">
        <Panel className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Avatar user={{ name: name || me.name, hue: me.hue }} size={64} />
            <div>
              <p className="text-lg font-semibold">{name || me.name}</p>
              <p className="text-sm text-muted">{me.email}</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              update(me.id, { name: name.trim(), pronouns: pronouns.trim() || undefined, bio: bio.trim() || undefined });
              toast("Profile saved");
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Field label="Display name" error={!name.trim() ? "Name cannot be empty." : undefined}>{(id) => <input id={id} value={name} onChange={(e) => setName(e.target.value)} className={cn(inputClass, "h-10")} />}</Field>
            <Field label="Pronouns">{(id) => <input id={id} value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="she/her, he/him, they/them" className={cn(inputClass, "h-10")} />}</Field>
            <div className="sm:col-span-2">
              <Field label="Bio" hint="Shown on your profile in each course.">{(id) => <textarea id={id} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className={cn(inputClass, "py-2.5")} />}</Field>
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" variant="primary" disabled={!dirty || !name.trim()}>
                Save profile
              </Button>
            </div>
          </form>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-[15px] font-semibold">Appearance</h2>
          <p className="mb-4 text-sm text-muted">System follows your device setting.</p>
          <Segmented label="Theme" value={pref} onChange={(v) => { setPref(v); setTheme(v); }} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} />
        </Panel>

        <Panel className="p-6">
          <h2 className="text-[15px] font-semibold">Notifications</h2>
          <p className="mb-2 text-sm text-muted">What shows up in your Activity panel.</p>
          <ul className="divide-y divide-line">
            {notifyRows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted">{r.hint}</p>
                </div>
                <Switch checked={notify[r.id]} onChange={(v) => setN(r.id, v)} label={r.label} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-[15px] font-semibold">Your data</h2>
          <p className="mb-4 text-sm text-muted">Everything is stored in this browser only.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportData}>
              <DownloadSimple size={16} /> Export my data
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm("Reset all demo data? Your submissions, messages and edits will be replaced with the original sample data.")) {
                  reset();
                  toast("Demo data restored", undefined, "info");
                }
              }}
            >
              <ArrowCounterClockwise size={16} /> Reset demo data
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                signOut();
                router.replace("/");
              }}
            >
              <SignOut size={16} /> Sign out
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
