import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/lib/klokk-verify";

const COOLDOWN_SECONDS = 60;

/** Resend button with a short cooldown so it can't be spammed. */
export function ResendVerificationButton({
  email,
  variant = "outline",
}: {
  email: string;
  variant?: "outline" | "default";
}) {
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async () => {
    setBusy(true);
    const { error } = await resendVerificationEmail(email);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Verification email sent to ${email}`);
    setWait(COOLDOWN_SECONDS);
  };

  return (
    <Button type="button" variant={variant} size="sm" onClick={send} disabled={busy || wait > 0}>
      {wait > 0 ? `Resend available in ${wait}s` : "Resend verification email"}
    </Button>
  );
}

/** Shown wherever a signed-in organiser hasn't verified their email yet. */
export function VerifyEmailNotice({ email }: { email: string }) {
  return (
    <div
      role="status"
      className="mt-6 rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground"
    >
      <div className="flex items-start gap-3">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-2">
          <p className="font-medium">Verify your email to create events</p>
          <p className="text-muted-foreground">
            We sent a verification email to <strong>{email}</strong>. Open it, click the{" "}
            <strong>verify</strong> link, then come back here and refresh this page. If you can't
            see it, check your spam or junk folder.
          </p>
          <ResendVerificationButton email={email} />
        </div>
      </div>
    </div>
  );
}
