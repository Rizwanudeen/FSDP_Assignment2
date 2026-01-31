-- Run this in MSSQL to export data as INSERT statements
-- Save output and convert to PostgreSQL format

USE FSDP;
GO

-- Export Users
SELECT 
    'INSERT INTO users (id, email, name, password, created_at, updated_at) VALUES (' +
    '''' + CAST(id AS VARCHAR(36)) + '''::uuid, ' +
    '''' + REPLACE(email, '''', '''''') + ''', ' +
    CASE WHEN name IS NULL THEN 'NULL' ELSE '''' + REPLACE(name, '''', '''''') + '''' END + ', ' +
    '''' + REPLACE(password, '''', '''''') + ''', ' +
    '''' + CONVERT(VARCHAR(23), createdAt, 126) + 'Z'', ' +
    '''' + CONVERT(VARCHAR(23), updatedAt, 126) + 'Z''' +
    ');'
FROM Users;

-- Export Agents
SELECT 
    'INSERT INTO agents (id, name, description, type, status, avatar, user_id, visibility, is_deleted, created_at, updated_at) VALUES (' +
    '''' + CAST(id AS VARCHAR(36)) + '''::uuid, ' +
    CASE WHEN name IS NULL THEN 'NULL' ELSE '''' + REPLACE(name, '''', '''''') + '''' END + ', ' +
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' + REPLACE(description, '''', '''''') + '''' END + ', ' +
    CASE WHEN type IS NULL THEN 'NULL' ELSE '''' + REPLACE(type, '''', '''''') + '''' END + ', ' +
    '''' + status + ''', ' +
    CASE WHEN avatar IS NULL THEN 'NULL' ELSE '''' + REPLACE(avatar, '''', '''''') + '''' END + ', ' +
    '''' + CAST(userId AS VARCHAR(36)) + '''::uuid, ' +
    '''' + COALESCE(visibility, 'private') + ''', ' +
    CASE WHEN isDeleted = 1 THEN 'TRUE' ELSE 'FALSE' END + ', ' +
    '''' + CONVERT(VARCHAR(23), createdAt, 126) + 'Z'', ' +
    '''' + CONVERT(VARCHAR(23), updatedAt, 126) + 'Z''' +
    ');'
FROM Agents;

-- Continue for other tables...
-- (Run similar queries for Conversations, Messages, Teams, etc.)
