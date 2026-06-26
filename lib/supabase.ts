import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

export const supabase = createBrowserSupabaseClient()

export async function signUp(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signOut() {
  const { logout } = await import('@/lib/auth/logout')
  return logout()
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    return { data: data?.user, error }
  } catch (error) {
    return { data: null, error }
  }
}
