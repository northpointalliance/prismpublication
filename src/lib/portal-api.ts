import { supabase } from "@/integrations/supabase/client";

export const getPortalHeaders = async (email: string): Promise<Record<string, string>> => {
  const normalizedEmail = email.trim().toLowerCase();
  const headers: Record<string, string> = {
    "x-user-email": normalizedEmail,
  };

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};
