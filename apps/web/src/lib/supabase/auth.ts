import { createClient } from './client';

interface User {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}

const supabase = createClient();

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return { ...data, error };
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_, session) => {
    callback(session?.user as User | null);
  });
}