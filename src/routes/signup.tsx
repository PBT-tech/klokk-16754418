import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KlokkFullLogo } from "@/components/klokk/logo";
import { supabase } from "@/integrations/supabase/client";
import { sendSignupNotification } from "@/lib/klokk-email";
import { buildTrackingPayload, postTrackingEvent } from "@/lib/klokk-tracking";
import { useSession } from "@/lib/klokk-hooks";

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
  })
  .refine((d) => d.email && d.password, { path: ["email"], message: "" });

type FormValues = z.infer<typeof schema>;

function SignUp() {
  const navigate = useNavigate();
  const session = useSession();
  const [created, setCreated] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  if (session && !created) {
    navigate({ to: "/events/new" });
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const redirect = typeof window !== "undefined" ? `${window.location.origin}/signin` : undefined;
    const options: { data: object; emailRedirectTo?: string } = {
      data: { first_name: values.firstName, last_name: values.lastName },
    };
    if (redirect) options.emailRedirectTo = redirect;

    let signUpResult;
    try {
      signUpResult = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Network connection error. Please refresh the page and try again.",
      );
      return;
    }

    const { data, error } = signUpResult;
    if (error) {
      toast.error(error.message);
      return;
    }
    // Create the profile row if session/user is available (best-effort, RLS allows self-insert)
    if (data?.user) {
      try {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: values.email,
          first_name: values.firstName,
          last_name: values.lastName,
          email_verified: false,
        });
      } catch {
        /* best-effort */
      }
    }
    // Fire the CRM form-tracking event so a contact is created in the
    // sub-account. Fire-and-forget — never blocks the UX.
    try {
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
      postTrackingEvent(trackingPayload);
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
    setPendingEmail(values.email);
    setCreated(true);
    toast.success("Account created — check your email to verify");
  };

  if (created) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-signup-page-bg">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
          <div className="rounded-2xl border border-border bg-signup-section-bg p-8 text-center text-card-foreground shadow-premium">
            <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Mail className="size-6" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-semibold text-card-foreground">
              Verify your email
            </h1>
            <p className="mt-2 text-sm text-card-foreground/80">
              We sent a verification link to{" "}
              <span className="font-medium text-card-foreground">{pendingEmail}</span>. You'll need
              to verify before creating your first event.
            </p>
            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  toast.success("Email verified");
                  navigate({ to: "/events/new" });
                }}
              >
                <CheckCircle2 className="size-4" />
                I've verified — continue
              </Button>
              <Button
                variant="outline"
                className="w-full bg-card text-card-foreground border-border hover:bg-card/90"
                onClick={async () => {
                  const redirect =
                    typeof window !== "undefined" ? `${window.location.origin}/signin` : undefined;
                  const opts: { emailRedirectTo?: string } = {};
                  if (redirect) opts.emailRedirectTo = redirect;
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email: pendingEmail,
                    options: opts,
                  });
                  if (error) toast.error(error.message);
                  else toast.success("Verification email resent");
                }}
              >
                Resend verification email
              </Button>
            </div>
            <p className="mt-4 text-xs text-card-foreground/70">
              Click the link in your email, then return here to continue.
            </p>
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
              />
            </Field>
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
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
