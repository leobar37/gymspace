-- Database optimization for subscription management system
-- This file contains SQL commands to optimize database performance for subscription analytics

-- Indexes for subscription_organizations table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_organizations_active_status 
ON subscription_organizations (is_active, status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_organizations_dates 
ON subscription_organizations (start_date, end_date) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_organizations_org_plan 
ON subscription_organizations (organization_id, subscription_plan_id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_organizations_created_at 
ON subscription_organizations (created_at) WHERE deleted_at IS NULL;

-- Indexes for subscription_requests table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_status 
ON subscription_requests (status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_operation_type 
ON subscription_requests (operation_type) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_org_status 
ON subscription_requests (organization_id, status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_created_processed 
ON subscription_requests (created_at, processed_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_pending_stale 
ON subscription_requests (status, created_at) WHERE status = 'pending' AND deleted_at IS NULL;

-- Indexes for subscription_operations table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_operations_org_type 
ON subscription_operations (organization_id, operation_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_operations_effective_date 
ON subscription_operations (effective_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_operations_created_at 
ON subscription_operations (created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_operations_request_id 
ON subscription_operations (subscription_request_id) WHERE subscription_request_id IS NOT NULL;

-- Indexes for subscription_plans table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_active_public 
ON subscription_plans (is_active, is_public) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_sort_order 
ON subscription_plans (sort_order, name) WHERE deleted_at IS NULL;

-- Indexes for organizations table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_name_search 
ON organizations USING gin(to_tsvector('english', name)) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_owner_user 
ON organizations (owner_user_id) WHERE deleted_at IS NULL;

-- Indexes for subscription_cancellations table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_cancellations_org_reason 
ON subscription_cancellations (organization_id, reason) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_cancellations_effective_date 
ON subscription_cancellations (effective_date) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_orgs_analytics 
ON subscription_organizations (is_active, status, start_date, end_date, subscription_plan_id) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_analytics 
ON subscription_requests (status, operation_type, created_at, processed_at) 
WHERE deleted_at IS NULL;

-- Partial indexes for frequently filtered data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_organizations_active_only 
ON subscription_organizations (subscription_plan_id, start_date, end_date) 
WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_pending_only 
ON subscription_requests (created_at, organization_id) 
WHERE status = 'pending' AND deleted_at IS NULL;

-- Analytics-specific indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_operations_analytics_by_date 
ON subscription_operations (operation_type, effective_date, organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_requests_analytics_by_date 
ON subscription_requests (operation_type, status, created_at, organization_id) 
WHERE deleted_at IS NULL;

-- Performance monitoring queries
-- Use these to monitor index usage and query performance

-- Query to check index usage
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_blks_read,
    idx_blks_hit
FROM pg_stat_user_indexes 
WHERE tablename LIKE 'subscription_%'
ORDER BY idx_tup_read + idx_tup_fetch DESC;
*/

-- Query to find slow queries related to subscriptions
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%subscription_%'
ORDER BY total_time DESC
LIMIT 10;
*/

-- Query to check table sizes
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename LIKE 'subscription_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/