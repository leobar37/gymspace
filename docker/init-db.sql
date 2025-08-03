-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types that will be used in the schema
CREATE TYPE user_type AS ENUM ('owner', 'collaborator');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE collaborator_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE client_status AS ENUM ('active', 'inactive');
CREATE TYPE plan_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE contract_status AS ENUM ('pending', 'active', 'expiring_soon', 'expired', 'cancelled');
CREATE TYPE payment_frequency AS ENUM ('monthly', 'quarterly', 'annual');
CREATE TYPE asset_status AS ENUM ('active', 'deleted');
CREATE TYPE evaluation_type AS ENUM ('initial', 'progress', 'final');
CREATE TYPE evaluation_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE comment_type AS ENUM ('progress_note', 'phone_call', 'meeting', 'reminder', 'other');
CREATE TYPE asset_category AS ENUM ('medical_document', 'identification', 'insurance', 'contract_copy', 'other');
CREATE TYPE contract_asset_type AS ENUM ('payment_receipt', 'contract_document', 'identification', 'other');
CREATE TYPE evaluation_asset_stage AS ENUM ('initial', 'progress', 'final');
CREATE TYPE evaluation_asset_category AS ENUM ('body_photo', 'measurement_photo', 'document', 'report', 'other');

-- Grant permissions to the gymspace user
GRANT ALL PRIVILEGES ON DATABASE gymspace_dev TO gymspace;
GRANT CREATE ON SCHEMA public TO gymspace;