-- ============================================================================
-- TRADERS-HUB STRICT SCHEMA (Phase 1 & 2)
-- Database: PostgreSQL (Supabase)
-- ============================================================================

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    public_portfolio BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trades Table (The Ledger Core)
-- CRITICAL FIX: Precision set to 4 decimal places as per RULES.md
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('LONG', 'SHORT')), -- CRITICAL FIX: Directional logic only
    entry_price NUMERIC(24,4) NOT NULL CHECK (entry_price > 0),
    exit_price NUMERIC(24,4) CHECK (exit_price >= 0),
    position_size NUMERIC(24,4) NOT NULL CHECK (position_size > 0),
    realized_pl_usd NUMERIC(24,4),
    realized_pl_percent NUMERIC(14,4),
    notes TEXT,
    chart_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMPTZ
);

-- 3. Performance Indexes
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_created_at ON public.trades(created_at);
CREATE INDEX idx_trades_asset ON public.trades(asset);

-- ============================================================================
-- DATABASE TRIGGERS (Integrity & Math)
-- ============================================================================

-- A. Trigger: Immutable History Protection
-- CRITICAL FIX: Prevent users from rewriting financial history (asset, action, entry_price, position_size) after insert.
CREATE OR REPLACE FUNCTION public.prevent_core_trade_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.asset <> NEW.asset THEN
        RAISE EXCEPTION 'Immutable core data: Cannot change asset after trade is opened.';
    END IF;
    IF OLD.action <> NEW.action THEN
        RAISE EXCEPTION 'Immutable core data: Cannot change action (LONG/SHORT) after trade is opened.';
    END IF;
    IF OLD.entry_price <> NEW.entry_price THEN
        RAISE EXCEPTION 'Immutable core data: Cannot change entry_price after trade is opened.';
    END IF;
    IF OLD.position_size <> NEW.position_size THEN
        RAISE EXCEPTION 'Immutable core data: Cannot change position_size after trade is opened.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_immutable_trade_history
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.prevent_core_trade_mutation();

-- B. Trigger: Automatically calculate Realized P/L
CREATE OR REPLACE FUNCTION public.calculate_trade_pl()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.exit_price IS NOT NULL THEN
        IF NEW.action = 'LONG' THEN
            NEW.realized_pl_usd := (NEW.exit_price - NEW.entry_price) * NEW.position_size;
            NEW.realized_pl_percent := ((NEW.exit_price - NEW.entry_price) / NEW.entry_price) * 100;
        ELSIF NEW.action = 'SHORT' THEN
            NEW.realized_pl_usd := (NEW.entry_price - NEW.exit_price) * NEW.position_size;
            NEW.realized_pl_percent := ((NEW.entry_price - NEW.exit_price) / NEW.entry_price) * 100;
        END IF;

        IF NEW.closed_at IS NULL THEN
            NEW.closed_at := timezone('utc'::text, now());
        END IF;
    ELSE
        NEW.realized_pl_usd := NULL;
        NEW.realized_pl_percent := NULL;
        NEW.closed_at := NULL;
    END IF;

    -- Note: updated_at is handled by Supabase defaults or a separate trigger if needed, 
    -- but we enforce it here to be explicit on mathematical updates.
    NEW.updated_at := timezone('utc'::text, now());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_trade_pl_trigger
BEFORE INSERT OR UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.calculate_trade_pl();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & VIEWS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TRADES POLICIES
-- CRITICAL FIX: Removed the slow EXISTS() subquery for public reading.
-- Instead, the base `trades` table is STRICTLY limited to the owner.
CREATE POLICY "Users can insert their own trades."
ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own trades."
ON public.trades FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades."
ON public.trades FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades."
ON public.trades FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- OPTIMIZED PUBLIC LEADERBOARD VIEW
-- ============================================================================
-- CRITICAL FIX: Create a highly optimized view for the public portfolio.
-- This bypasses the row-by-row RLS EXISTS check limitation.
-- It works because views run with the privileges of their creator (security definer by default),
-- joining the tables efficiently and filtering based on the public_portfolio flag.

CREATE OR REPLACE VIEW public.public_trades_leaderboard AS
SELECT 
    t.id,
    t.user_id,
    p.username,
    t.asset,
    t.action,
    t.entry_price,
    t.exit_price,
    t.position_size,
    t.realized_pl_usd,
    t.realized_pl_percent,
    t.notes,
    t.created_at,
    t.closed_at
FROM 
    public.trades t
JOIN 
    public.profiles p ON t.user_id = p.id
WHERE 
    p.public_portfolio = true;

-- Grant read access to the view for authenticated (and optionally anon) users.
GRANT SELECT ON public.public_trades_leaderboard TO authenticated;
GRANT SELECT ON public.public_trades_leaderboard TO anon;
