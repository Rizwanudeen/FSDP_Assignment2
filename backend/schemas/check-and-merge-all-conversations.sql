-- Check all conversations for the shared agent
-- Agent ID: 9a657dc4-16f9-4e05-909f-a90e325293b8

-- Step 1: List all conversations for this agent
SELECT 
    c.id as conversation_id,
    c.user_id,
    u.email as owner_email,
    c.title,
    c.created_at,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.agent_id = '9a657dc4-16f9-4e05-909f-a90e325293b8'
ORDER BY c.created_at ASC;

-- Step 2: Find the oldest conversation (this should be the primary one)
-- Expected: 4863428b-d156-4b4d-93ef-a4ef9db8b11d

-- Step 3: Merge ALL other conversations into the oldest one
-- Move messages from 7d61433d-f494-4434-b0e3-38b5e5fc9b78 to 4863428b-d156-4b4d-93ef-a4ef9db8b11d
UPDATE messages
SET conversation_id = '4863428b-d156-4b4d-93ef-a4ef9db8b11d'
WHERE conversation_id = '7d61433d-f494-4434-b0e3-38b5e5fc9b78';

-- Step 4: Delete the duplicate conversation
DELETE FROM conversations
WHERE id = '7d61433d-f494-4434-b0e3-38b5e5fc9b78';

-- Step 5: Merge any other conversations that might exist
-- (Replace with actual IDs after checking Step 1 results)
UPDATE messages
SET conversation_id = '4863428b-d156-4b4d-93ef-a4ef9db8b11d'
WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE agent_id = '9a657dc4-16f9-4e05-909f-a90e325293b8'
    AND id != '4863428b-d156-4b4d-93ef-a4ef9db8b11d'
);

-- Step 6: Delete all duplicate conversations
DELETE FROM conversations
WHERE agent_id = '9a657dc4-16f9-4e05-909f-a90e325293b8'
AND id != '4863428b-d156-4b4d-93ef-a4ef9db8b11d';

-- Step 7: Update the primary conversation to be owned by the agent owner
-- (Agent owner: riz@gmail.com, ID: 6ad658d4-8298-4a7b-afff-459470d0b78e)
UPDATE conversations
SET user_id = '6ad658d4-8298-4a7b-afff-459470d0b78e',
    title = 'Shared Conversation'
WHERE id = '4863428b-d156-4b4d-93ef-a4ef9db8b11d';

-- Step 8: Verify - should only show ONE conversation
SELECT 
    c.id as conversation_id,
    c.user_id,
    u.email as owner_email,
    c.title,
    c.created_at,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.agent_id = '9a657dc4-16f9-4e05-909f-a90e325293b8'
ORDER BY c.created_at ASC;
