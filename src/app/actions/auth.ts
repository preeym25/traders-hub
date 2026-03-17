"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// --- VALIDATION SCHEMAS ---
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Passkey required"),
});

const SignupSchema = z.object({
  username: z
    .string()
    .min(3, "Call Sign must be at least 3 characters")
    .max(24, "Call Sign is too long (max 24)")
    .regex(/^[a-zA-Z0-9_]+$/, "Call Sign can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Passkey must be at least 6 characters"),
});

// --- SERVER ACTIONS ---

export async function login(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Strict Validation
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return redirect(`/login?message=${encodeURIComponent(validatedFields.error.issues[0].message)}`);
  }

  // 2. Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Strict Validation
  const validatedFields = SignupSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
      return redirect(`/signup?message=${encodeURIComponent(validatedFields.error.issues[0].message)}`);
  }

  // 2. Supabase Auth
  const { error } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    options: {
        data: {
            username: validatedFields.data.username // Handled cleanly by Postgres Trigger
        }
    }
  });

  if (error) {
    return redirect(`/signup?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}
