import { supabase } from "@/integrations/supabase/client";

/** Ask Supabase to send the sign-up confirmation email again. */
export async function resendVerificationEmail(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (!error) return { error: null };
    return {
      error: /rate limit|too many|seconds/i.test(error.message)
        ? "Please wait a minute before asking for another email."
        : "We couldn't send the email. Please try again shortly.",
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Network connection error. Please try again.",
    };
  }
}
