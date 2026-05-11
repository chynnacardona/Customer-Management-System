DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE customer;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
