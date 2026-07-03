-- Allow authenticated users to record their own terms acknowledgement (PrimeAI / dashboard banner).
CREATE POLICY "Users insert own terms acknowledgements"
  ON user_terms_acknowledgements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own terms acknowledgements"
  ON user_terms_acknowledgements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
