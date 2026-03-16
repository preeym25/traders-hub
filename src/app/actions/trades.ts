"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================================================
// IN-MEMORY RATE LIMITING (Basic Throttle)
// ============================================================================
// Note: In a true production serverless environment (Vercel), this Map resets on cold starts.
// For robust rate limiting across edge nodes, Upstash Redis or Vercel KV is required.
const rateLimitStore = new Map<string, number[]>();
const MAX_REQUESTS = 5;       // 5 requests allowed per timeframe
const TIMEFRAME_MS = 60000;   // 1 minute

function applyRateLimit(userId: string): boolean {
  const now = Date.now();
  const userTimestamps = rateLimitStore.get(userId) || [];
  
  // Filter out timestamps older than our timeframe
  const recentRequests = userTimestamps.filter(timestamp => now - timestamp < TIMEFRAME_MS);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false; // Rate limited
  }

  // Record this new request
  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  return true; // Allowed
}

// ============================================================================
// STRICT VALIDATION SCHEMAS
// ============================================================================

const OpenTradeSchema = z.object({
  asset: z.string().min(1, "Asset symbol is required").max(20, "Asset symbol too long"),
  action: z.enum(["LONG", "SHORT"]),
  entry_price: z.number()
    .positive("Entry price must be greater than 0")
    .max(9999999, "Entry price exceeds maximum limit")
    .multipleOf(0.0001, "Maximum 4 decimal places allowed"),
  position_size: z.number()
    .positive("Position size must be greater than 0")
    .max(9999999, "Position size exceeds maximum limit")
    .multipleOf(0.0001, "Maximum 4 decimal places allowed"),
  notes: z.string().optional(),
  chart_image_url: z.string().url("Invalid chart URL").optional().or(z.literal("")),
});

const CloseTradeSchema = z.object({
  trade_id: z.string().uuid("Invalid Trade ID"),
  exit_price: z.number()
    .nonnegative("Exit price must be 0 or greater")
    .max(9999999, "Exit price exceeds maximum limit")
    .multipleOf(0.0001, "Maximum 4 decimal places allowed"),
});

// ============================================================================
// SERVER ACTIONS
// ============================================================================

export async function openTrade(formData: FormData) {
  try {
    // 1. Zero Client-Side Trust: Verify Session and Extract ID server-side
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // 2. Rate Limiting Check
    if (!applyRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return { success: false, error: "Too many requests. Please wait a minute and try again." };
    }

    // 3. Strict Input Validation
    const rawData = {
      asset: formData.get("asset"),
      action: formData.get("action"),
      entry_price: Number(formData.get("entry_price")),
      position_size: Number(formData.get("position_size")),
      notes: formData.get("notes")?.toString(),
      chart_image_url: formData.get("chart_image_url")?.toString(),
    };

    const validatedData = OpenTradeSchema.safeParse(rawData);

    if (!validatedData.success) {
      // Map Zod errors safely without leaking internal stack traces
      const errorMsg = validatedData.error.errors.map(e => e.message).join(", ");
      return { success: false, error: `Validation failed: ${errorMsg}` };
    }

    // 4. Database Insertion (RLS guarantees they can only insert for themselves)
    const { error: dbError } = await supabase.from("trades").insert({
      user_id: user.id, // Enforced sever-side
      asset: validatedData.data.asset,
      action: validatedData.data.action,
      entry_price: validatedData.data.entry_price,
      position_size: validatedData.data.position_size,
      notes: validatedData.data.notes,
      chart_image_url: validatedData.data.chart_image_url || null,
    });

    if (dbError) {
      console.error("Database Insert Error:", dbError);
      // Do not leak raw PostgreSQL errors
      return { success: false, error: "Failed to open trade due to a system error." };
    }

    revalidatePath("/dashboard");
    return { success: true };

  } catch (err) {
    console.error("System Error in openTrade:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function closeTrade(formData: FormData) {
  try {
    // 1. Zero Client-Side Trust
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // 2. Rate Limiting Check
    if (!applyRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.id} on closeTrade`);
      return { success: false, error: "Too many requests. Please wait a minute and try again." };
    }

    // 3. Strict Input Validation
    const rawData = {
      trade_id: formData.get("trade_id"),
      exit_price: Number(formData.get("exit_price")),
    };

    const validatedData = CloseTradeSchema.safeParse(rawData);

    if (!validatedData.success) {
      const errorMsg = validatedData.error.errors.map(e => e.message).join(", ");
      return { success: false, error: `Validation failed: ${errorMsg}` };
    }

    // 4. Database Update (Postgres triggers will handle the P/L calculation mathematically)
    // RLS "FOR UPDATE USING (auth.uid() = user_id)" ensures they can't close someone else's trade
    const { error: dbError } = await supabase
      .from("trades")
      .update({ exit_price: validatedData.data.exit_price })
      .eq("id", validatedData.data.trade_id)
      .eq("user_id", user.id); // Double-verify user identity in the query

    if (dbError) {
      console.error("Database Update Error:", dbError);
      // Do not leak raw PostgreSQL errors
      return { success: false, error: "Failed to close trade due to a system error." };
    }

    revalidatePath("/dashboard");
    return { success: true };

  } catch (err) {
    console.error("System Error in closeTrade:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
