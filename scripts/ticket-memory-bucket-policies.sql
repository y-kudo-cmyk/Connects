-- Allow authenticated users to upload/read/update/delete in tickets and memories buckets

-- tickets
DROP POLICY IF EXISTS "auth can read tickets" ON storage.objects;
DROP POLICY IF EXISTS "auth can write tickets" ON storage.objects;
DROP POLICY IF EXISTS "auth can update tickets" ON storage.objects;
DROP POLICY IF EXISTS "auth can delete tickets" ON storage.objects;

CREATE POLICY "auth can read tickets" ON storage.objects
  FOR SELECT USING (bucket_id = 'tickets');
CREATE POLICY "auth can write tickets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tickets');
CREATE POLICY "auth can update tickets" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'tickets') WITH CHECK (bucket_id = 'tickets');
CREATE POLICY "auth can delete tickets" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'tickets');

-- memories
DROP POLICY IF EXISTS "auth can read memories" ON storage.objects;
DROP POLICY IF EXISTS "auth can write memories" ON storage.objects;
DROP POLICY IF EXISTS "auth can update memories" ON storage.objects;
DROP POLICY IF EXISTS "auth can delete memories" ON storage.objects;

CREATE POLICY "auth can read memories" ON storage.objects
  FOR SELECT USING (bucket_id = 'memories');
CREATE POLICY "auth can write memories" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memories');
CREATE POLICY "auth can update memories" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'memories') WITH CHECK (bucket_id = 'memories');
CREATE POLICY "auth can delete memories" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'memories');
