-- Add is_sleeping column to owned_tomica table
ALTER TABLE owned_tomica 
ADD COLUMN is_sleeping BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN owned_tomica.is_sleeping IS 'おやすみステータス: 片づけていて子供が遊べない状態を表す';