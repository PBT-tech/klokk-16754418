import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { plainError } from "@/lib/klokk-errors";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { KlokkFullLogo } from "@/components/klokk/logo";
import { PasswordStrength } from "@/components/klokk/password-strength";
import { supabase } from "@/integrations/supabase/client";
import { sendSignupNotification } from "@/lib/klokk-email";
import { buildTrackingPayload, postTrackingEvent } from "@/lib/klokk-tracking";
import { useSession } from "@/lib/klokk-hooks";
import { ResendVerificationButton } from "@/components/klokk/verify-email-notice";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Klokk account" },
      {
        name: "description",
        content: "Sign up for Klokk and start creating scheduling events in under a minute.",
      },
    ],
  }),
  component: SignUp,
});

const schema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    // Optional and unticked by default.
    marketingConsent: z.boolean(),
  })
  .refine((d) => d.email && d.password, { path: ["email"], message: "" });

type FormValues = z.infer<typeof schema>;

function SignUp() {
  const navigate = useNavigate();
  const session = useSession();
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (session) {
    navigate({ to: "/events/new" });
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { marketingConsent: false },
  });
  const passwordValue = watch("password");

  const onSubmit = async (values: FormValues) => {
    const consentAt = values.marketingConsent ? new Date().toISOString() : null;
    const options: { data: object } = {
      data: {
        first_name: values.firstName,
        last_name: values.lastName,
        marketing_consent: values.marketingConsent,
        marketing_consent_at: consentAt,
      },
    };

    let signUpResult;
    try {
      signUpResult = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options,
      });
    } catch (err) {
      toast.error(
        plainError(err, "Network connection error. Please refresh the page and try again."),
      );
      return;
    }

    const { data, error } = signUpResult;
    if (error) {
      toast.error(plainError(error, "Something went wrong. Please try again."));
      return;
    }

    // Create the profile row (best-effort, RLS allows self-insert).
    if (data?.user) {
      try {
        // Generated database types lag behind the migration until the project regenerates them.
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: values.email,
          first_name: values.firstName,
          last_name: values.lastName,
          marketing_consent: values.marketingConsent,
          marketing_consent_at: consentAt,
          marketing_consent_version: "2026-11-05",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      } catch {
        /* best-effort */
      }
    }

    // Add the organiser to Klokk's CRM only if they ticked the box. Fire-and-forget.
    try {
      if (!values.marketingConsent) throw new Error("no consent");
      const trackingPayload = buildTrackingPayload(
        "klokk-signup",
        "Klokk Sign-up",
        {
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
        },
        {
          first_name: "First name",
          last_name: "Last name",
          email: "Email",
        },
      );
      postTrackingEvent(trackingPayload, {
        customFields: {
          HW6sdINihzHa9KowrSTE: { value: "free", label: "Account Level" },
          mktg_consent: { value: "yes", label: "Marketing consent" },
          type: { value: "organiser", label: "Type" },
        },
      });
    } catch {
      /* best-effort */
    }

    // Notify the sub-account owner that a new organiser signed up.
    try {
      sendSignupNotification({
        newOrganiserEmail: values.email,
        newOrganiserName: `${values.firstName} ${values.lastName}`,
      });
    } catch {
      /* best-effort */
    }

    if (!data?.session) {
      // Email confirmation is on: there is no session until the address is verified.
      setSentTo(values.email);
      return;
    }
    toast.success("Account created — welcome to Klokk");
    navigate({ to: "/events/new" });
  };

  if (sentTo) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-signup-page-bg">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
          <div className="rounded-2xl border border-border bg-signup-section-bg p-8 shadow-premium">
            <MailCheck className="size-8 text-primary" />
            <h1 className="mt-3 font-display text-2xl font-semibold text-signup-heading text-sidebar-primary-foreground text-pricing-amount">
              Check your inbox
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is created. We sent a verification email to <strong>{sentTo}</strong>.
            </p>
            <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-foreground">
              <li>Open the email from Klokk (check your spam or junk folder if it isn't there).</li>
              <li>
                Click the <strong>verify</strong> link in the email.
              </li>
              <li>Come back and sign in. You can then create events.</li>
            </ol>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ResendVerificationButton email={sentTo} />
              <Link
                to="/signin"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-signup-page-bg">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex justify-center" aria-label="Klokk home">
            <KlokkFullLogo size="md" variant="horizontal" imgClassName="h-[208px] max-w-[728px]" />
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-signup-section-bg p-8 shadow-premium">
          <h1 className="font-display text-2xl font-semibold text-signup-heading text-sidebar-primary-foreground text-pricing-amount">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Start scheduling in under a minute. No card required.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={errors.firstName?.message}>
                <Input placeholder="Avery" {...register("firstName")} className="border-brand" />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <Input placeholder="Hollis" {...register("lastName")} className="border-brand" />
              </Field>
            </div>
            <Field label="Email" error={errors.email?.message}>
              <Input
                type="email"
                placeholder="you@studio.co"
                {...register("email")}
                className="border-brand"
              />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <Input
                type="password"
                placeholder="At least 8 characters"
                {...register("password")}
                className="border-brand"
                autoComplete="new-password"
              />
              <PasswordStrength value={passwordValue ?? ""} />
            </Field>
            <Controller
              control={control}
              name="marketingConsent"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Klokk (Pegasus Apps) may contact me about Klokk, including news, tips and
                    offers. Optional. I can unsubscribe at any time.
                  </span>
                </label>
              )}
            />
            <p className="text-sm text-muted-foreground">
              The free plan includes 3 events. Free-plan events and their responses are deleted
              automatically 90 days after they are created.
            </p>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Create account
              <ArrowRight className="size-4" />
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
