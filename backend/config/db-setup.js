const { pool } = require('./database');

// Enhanced schema based on your analysis results structure
const createTablesQuery = `
-- Main analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    
    -- File Information
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- S3 Storage Information
    s3_url VARCHAR(500),
    s3_key VARCHAR(500),
    s3_bucket VARCHAR(255),
    
    -- Officer Information
    sector_officer_ps_name VARCHAR(255),
    sector_officer_cadre VARCHAR(100),
    sector_officer_name VARCHAR(255),
    image_captured_by_name VARCHAR(255),
    image_captured_by_officer_id VARCHAR(100),
    image_captured_officer_cadre VARCHAR(100),
    
    -- Jurisdiction Information
    ps_jurisdiction_ps_name VARCHAR(255),
    point_name VARCHAR(255),
    
    -- Vehicle Information
    license_plate_number VARCHAR(50),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_color VARCHAR(50),
    vehicle_type VARCHAR(50),
    driver_gender VARCHAR(20),
    fake_plate BOOLEAN DEFAULT FALSE,
    owner_address TEXT,
    
    -- Analysis Results
    quality_category VARCHAR(50),
    quality_score DECIMAL(5,2),
    rta_matched BOOLEAN DEFAULT FALSE,
    overall_verdict VARCHAR(50),
    confidence_score DECIMAL(5,2),
    
    -- Violation Information
    violations_detected INTEGER DEFAULT 0,
    violation_types JSONB,
    
    -- Step Analysis Data (JSON storage for detailed results)
    step1_quality_data JSONB,
    step2_ocr_data JSONB,
    step3_rta_data JSONB,
    step4_vehicle_data JSONB,
    step5_comparison_data JSONB,
    step6_violation_data JSONB,
    
    -- Complete Analysis Response
    full_analysis_response JSONB,
    
    -- Processing Status
    status VARCHAR(50) DEFAULT 'processing',
    processing_error TEXT,
    
    -- Timestamps
    analysis_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analysis_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Violations details table (normalized)
CREATE TABLE IF NOT EXISTS violations (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    confidence DECIMAL(5,2),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RTA matching details table
CREATE TABLE IF NOT EXISTS rta_matches (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    parameter_name VARCHAR(50) NOT NULL,
    rta_value VARCHAR(255),
    ai_detected_value VARCHAR(255),
    match_status VARCHAR(20),
    confidence DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Officer actions/reviews table
CREATE TABLE IF NOT EXISTS officer_reviews (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    officer_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'modified'
    reason TEXT,
    modifications JSONB,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_license_plate ON analysis_results(license_plate_number);
CREATE INDEX IF NOT EXISTS idx_sector_officer_name ON analysis_results(sector_officer_name);
CREATE INDEX IF NOT EXISTS idx_ps_jurisdiction ON analysis_results(ps_jurisdiction_ps_name);
CREATE INDEX IF NOT EXISTS idx_point_name ON analysis_results(point_name);
CREATE INDEX IF NOT EXISTS idx_uploaded_at ON analysis_results(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_officer_id ON analysis_results(image_captured_by_officer_id);
CREATE INDEX IF NOT EXISTS idx_status ON analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_uuid ON analysis_results(uuid);
CREATE INDEX IF NOT EXISTS idx_violations_analysis ON violations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_rta_matches_analysis ON rta_matches(analysis_id);
CREATE INDEX IF NOT EXISTS idx_officer_reviews_analysis ON officer_reviews(analysis_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analysis_results_updated_at 
    BEFORE UPDATE ON analysis_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function setupDatabase() {
    const client = await pool.connect();
    try {
        console.log('🚀 Setting up database tables...');
        await client.query(createTablesQuery);
        console.log('✅ Database tables created successfully');
        
        // Test the connection
        const testResult = await client.query('SELECT NOW() as current_time');
        console.log('🕐 Database connection test:', testResult.rows[0].current_time);
        
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Function to check if database is ready
async function checkDatabaseConnection() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

module.exports = {
    setupDatabase,
    checkDatabaseConnection
};
