-- Merge separate conversations for shared agents into one
-- This moves all messages to the oldest conversation and deletes duplicates

-- For agent 9a657dc4-16f9-4e05-909f-a90e325293b8
-- Move all messages from newer conversations to the oldest one

-- Step 1: Find the oldest conversation for this agent
-- (Should be 4863428b-d156-4b4d-93ef-a4ef9db8b11d based on logs)

-- Step 2: Move messages from e10bfda6-52eb-4067-a905-3dd96e2cc0f1 to 4863428b-d156-4b4d-93ef-a4ef9db8b11d
UPDATE messages
SET conversation_id = '4863428b-d156-4b4d-93ef-a4ef9db8b11d'
WHERE conversation_id = 'e10bfda6-52eb-4067-a905-3dd96e2cc0f1';

-- Step 3: Delete the empty duplicate conversation
DELETE FROM conversations
WHERE id = 'e10bfda6-52eb-4067-a905-3dd96e2cc0f1';

-- Verify: Check all conversations for this agent
SELECT id, user_id, agent_id, title, created_at 
FROM conversations 
WHERE agent_id = '9a657dc4-16f9-4e05-909f-a90e325293b8'
ORDER BY created_at;

-- Verify: Check message count in remaining conversation
SELECT conversation_id, COUNT(*) as message_count
FROM messages
WHERE conversation_id = '4863428b-d156-4b4d-93ef-a4ef9db8b11d'
GROUP BY conversation_id;
