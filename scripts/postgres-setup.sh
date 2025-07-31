#!/bin/bash
set -e

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE minicde TO minicde_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO minicde_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO minicde_user;
EOSQL

echo "PostgreSQL setup completed successfully!" 