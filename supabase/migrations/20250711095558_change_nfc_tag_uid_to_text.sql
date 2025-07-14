-- Change nfc_tag_uid column from integer to text
ALTER TABLE owned_tomica 
ALTER COLUMN nfc_tag_uid TYPE TEXT USING nfc_tag_uid::TEXT;