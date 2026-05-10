-- User Table Guard
CREATE POLICY "Admin_Update_Status_Only" ON "user"
FOR UPDATE TO authenticated
USING (user_type != 'SUPERADMIN')
WITH CHECK (user_type != 'SUPERADMIN' AND (OLD.user_type = NEW.user_type));

-- Rights Table Guard
CREATE POLICY "Admin_Protect_Superadmin_Rights" ON "UserModule_Rights"
FOR ALL TO authenticated
USING (userid NOT IN (SELECT id FROM "user" WHERE user_type = 'SUPERADMIN'));
