-- Restore profit run ledger RPCs if migration 029 was not fully applied.
-- Safe to re-run: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION claim_profit_run_period(
  p_period_start DATE,
  p_period_end DATE,
  p_trading_days SMALLINT
)
RETURNS investment_profit_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run investment_profit_runs;
BEGIN
  INSERT INTO investment_profit_runs (
    period_start,
    period_end,
    trading_days,
    total_profit_usd,
    status
  )
  VALUES (p_period_start, p_period_end, p_trading_days, 0, 'processing')
  ON CONFLICT (period_start, period_end) DO NOTHING
  RETURNING * INTO v_run;

  RETURN v_run;
END;
$$;

CREATE OR REPLACE FUNCTION finalize_profit_run_period(
  p_period_start DATE,
  p_period_end DATE,
  p_total_profit_usd DECIMAL
)
RETURNS investment_profit_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run investment_profit_runs;
BEGIN
  UPDATE investment_profit_runs
  SET
    total_profit_usd = p_total_profit_usd,
    status = 'completed'
  WHERE period_start = p_period_start
    AND period_end = p_period_end
    AND status = 'processing'
  RETURNING * INTO v_run;

  RETURN v_run;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_profit_run_period(DATE, DATE, SMALLINT) TO service_role;
GRANT EXECUTE ON FUNCTION finalize_profit_run_period(DATE, DATE, DECIMAL) TO service_role;
