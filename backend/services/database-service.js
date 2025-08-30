const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
    
    // Create a new analysis record
    async createAnalysisRecord(fileData, officerData = {}) {
        const uuid = uuidv4();
        const insertQuery = `
            INSERT INTO analysis_results (
                uuid, filename, file_size, content_type,
                s3_url, s3_key, s3_bucket,
                sector_officer_ps_name, sector_officer_cadre, sector_officer_name,
                image_captured_by_name, image_captured_by_officer_id, image_captured_officer_cadre,
                ps_jurisdiction_ps_name, point_name,
                status, analysis_started_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id, uuid
        `;
        
        const values = [
            uuid,
            fileData.filename || 'unknown',
            fileData.fileSize || null,
            fileData.contentType || null,
            fileData.s3Url || null,
            fileData.s3Key || null,
            fileData.s3Bucket || null,
            officerData.sectorOfficerPsName || 'Jubilee Hills Traffic PS',
            officerData.sectorOfficerCadre || 'Police Constable',
            officerData.sectorOfficerName || 'Unknown',
            officerData.capturedByName || 'Unknown',
            officerData.capturedByOfficerId || null,
            officerData.capturedByCadre || 'Police Constable',
            officerData.psJurisdictionPsName || 'Jubilee Hills Traffic PS',
            officerData.pointName || 'Unknown',
            'processing',
            new Date()
        ];
        
        try {
            const result = await query(insertQuery, values);
            console.log(`✅ Created analysis record with ID: ${result.rows[0].id}, UUID: ${result.rows[0].uuid}`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error creating analysis record:', error);
            throw error;
        }
    }
    
    // Update analysis record with step analysis results
    async updateAnalysisResults(uuid, stepAnalysisResponse) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Extract data from step analysis response
            const step1Data = stepAnalysisResponse.results?.step1?.data;
            const step2Data = stepAnalysisResponse.results?.step2?.data;
            const step3Data = stepAnalysisResponse.results?.step3?.data;
            const step4Data = stepAnalysisResponse.results?.step4?.data;
            const step5Data = stepAnalysisResponse.results?.step5?.data;
            const step6Data = stepAnalysisResponse.results?.step6?.data;
            
            // Extract key fields
            const licenseplate = step1Data?.extracted_license_plate || 
                               step2Data?.license_plate || 
                               step3Data?.license_plate ||
                               step6Data?.license_plate;
            
            const qualityCategory = step1Data?.quality_category;
            const qualityScore = step1Data?.overall_quality_score;
            
            const vehicleAnalysis = step4Data?.vehicle_analysis;
            const comparisonResult = step5Data?.comparison_result;
            const violationAnalysis = step6Data?.violation_analysis;
            
            const violationsDetected = violationAnalysis?.detected_violation_count || 0;
            const violationTypes = violationAnalysis?.violation_types_found || [];
            
            const rtaMatched = comparisonResult?.overall_verdict === 'MATCH';
            const confidenceScore = comparisonResult?.confidence_score;
            
            // Update main analysis record
            const updateQuery = `
                UPDATE analysis_results SET
                    license_plate_number = $2,
                    vehicle_make = $3,
                    vehicle_model = $4,
                    vehicle_color = $5,
                    vehicle_type = $6,
                    quality_category = $7,
                    quality_score = $8,
                    rta_matched = $9,
                    overall_verdict = $10,
                    confidence_score = $11,
                    violations_detected = $12,
                    violation_types = $13,
                    step1_quality_data = $14,
                    step2_ocr_data = $15,
                    step3_rta_data = $16,
                    step4_vehicle_data = $17,
                    step5_comparison_data = $18,
                    step6_violation_data = $19,
                    full_analysis_response = $20,
                    status = $21,
                    analysis_completed_at = $22,
                    upload_source = $23
                WHERE uuid = $1
                RETURNING id
            `;
            
            const updateValues = [
                uuid,
                licenseplate,
                vehicleAnalysis?.make,
                vehicleAnalysis?.model,
                vehicleAnalysis?.color,
                vehicleAnalysis?.vehicle_type,
                qualityCategory,
                qualityScore,
                rtaMatched,
                comparisonResult?.overall_verdict,
                confidenceScore,
                violationsDetected,
                JSON.stringify(violationTypes),
                JSON.stringify(step1Data),
                JSON.stringify(step2Data),
                JSON.stringify(step3Data),
                JSON.stringify(step4Data),
                JSON.stringify(step5Data),
                JSON.stringify(step6Data),
                JSON.stringify(stepAnalysisResponse),
                'completed',
                new Date(),
                'manual' // upload_source, will be updated for S3 uploads
            ];
            
            const updateResult = await client.query(updateQuery, updateValues);
            const analysisId = updateResult.rows[0].id;
            
            // Insert violations into violations table
            if (violationTypes && violationTypes.length > 0) {
                for (const violation of violationTypes) {
                    await client.query(
                        'INSERT INTO violations (analysis_id, violation_type) VALUES ($1, $2)',
                        [analysisId, violation]
                    );
                }
            }
            
            // Insert RTA matches into rta_matches table
            if (comparisonResult?.parameter_analysis) {
                for (const [paramName, paramData] of Object.entries(comparisonResult.parameter_analysis)) {
                    await client.query(`
                        INSERT INTO rta_matches (analysis_id, parameter_name, rta_value, ai_detected_value, match_status, confidence)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        analysisId,
                        paramName,
                        paramData.rta_value,
                        paramData.ai_value,
                        paramData.match_status,
                        confidenceScore
                    ]);
                }
            }
            
            await client.query('COMMIT');
            console.log(`✅ Updated analysis record ${uuid} with complete results`);
            
            return { success: true, analysisId, uuid };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error updating analysis results:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // CRITICAL: Update review status (YES/NO flag) 
    async updateReviewStatus(uuid, officerId, action, reason = null) {
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            console.log(`📝 Updating review status for ${uuid}: ${action} by officer ${officerId}`);
            
            // Update the main analysis_results table with review flag and details
            const updateQuery = `
                UPDATE analysis_results SET
                    reviewed = 'YES',
                    review_action = $2,
                    review_reason = $3,
                    reviewed_by_officer_id = $4,
                    reviewed_at = $5,
                    updated_at = $5
                WHERE uuid = $1
                RETURNING id
            `;
            
            const updateValues = [
                uuid,
                action, // 'approved', 'rejected', 'modified'
                reason,
                officerId,
                new Date()
            ];
            
            const updateResult = await client.query(updateQuery, updateValues);
            
            if (updateResult.rows.length === 0) {
                throw new Error(`Analysis record ${uuid} not found`);
            }
            
            const analysisId = updateResult.rows[0].id;
            
            // Also record in officer_reviews table for detailed tracking
            const reviewQuery = `
                INSERT INTO officer_reviews (analysis_id, officer_id, action, reason, reviewed_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `;
            
            const reviewValues = [
                analysisId,
                officerId,
                action,
                reason,
                new Date()
            ];
            
            await client.query(reviewQuery, reviewValues);
            
            await client.query('COMMIT');
            
            console.log(`✅ Review status updated: ${uuid} -> reviewed='YES', action='${action}'`);
            
            return {
                uuid,
                reviewed: 'YES',
                review_action: action,
                review_reason: reason,
                reviewed_by_officer_id: officerId,
                reviewed_at: new Date().toISOString()
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error updating review status:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // Legacy method (kept for backward compatibility)
    async recordOfficerReview(uuid, officerId, action, reason = null, modifications = null) {
        try {
            // Get analysis ID first
            const analysisResult = await query('SELECT id FROM analysis_results WHERE uuid = $1', [uuid]);
            if (analysisResult.rows.length === 0) {
                throw new Error(`Analysis record not found for UUID: ${uuid}`);
            }
            
            const analysisId = analysisResult.rows[0].id;
            
            // Insert officer review
            await query(`
                INSERT INTO officer_reviews (analysis_id, officer_id, action, reason, modifications)
                VALUES ($1, $2, $3, $4, $5)
            `, [analysisId, officerId, action, reason, JSON.stringify(modifications)]);
            
            // Update main record status
            let newStatus = action;
            if (action === 'approved') newStatus = 'approved';
            else if (action === 'rejected') newStatus = 'rejected';
            else if (action === 'modified') newStatus = 'pending-review';
            
            await query('UPDATE analysis_results SET status = $1 WHERE uuid = $2', [newStatus, uuid]);
            
            console.log(`✅ Recorded officer review: ${action} by ${officerId} for ${uuid}`);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error recording officer review:', error);
            throw error;
        }
    }
    
    // Get analysis by UUID
    async getAnalysisByUuid(uuid) {
        try {
            const result = await query(`
                SELECT ar.*, 
                       array_agg(DISTINCT v.violation_type) as violation_list,
                       array_agg(DISTINCT rm.parameter_name) as rta_parameters
                FROM analysis_results ar
                LEFT JOIN violations v ON ar.id = v.analysis_id
                LEFT JOIN rta_matches rm ON ar.id = rm.analysis_id
                WHERE ar.uuid = $1
                GROUP BY ar.id
            `, [uuid]);
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error getting analysis by UUID:', error);
            throw error;
        }
    }
    
    // Get analyses by review status
    async getAnalysesByReviewStatus(reviewStatus = 'NO', limit = 50, offset = 0) {
        try {
            const result = await query(`
                SELECT 
                    uuid, filename, license_plate_number, vehicle_make, vehicle_model, vehicle_color,
                    violations_detected, violation_types, status, reviewed, review_action, review_reason,
                    reviewed_by_officer_id, reviewed_at, s3_url, s3_key,
                    sector_officer_ps_name, image_captured_by_officer_id,
                    created_at, analysis_completed_at
                FROM analysis_results 
                WHERE reviewed = $1
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            `, [reviewStatus, limit, offset]);
            
            console.log(`📋 Retrieved ${result.rows.length} analyses with review status: ${reviewStatus}`);
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting analyses by review status:', error);
            throw error;
        }
    }
    
    // Get recent analyses
    async getRecentAnalyses(limit = 50, offset = 0) {
        try {
            const result = await query(`
                SELECT uuid, filename, license_plate_number, status, violations_detected,
                       s3_url, s3_key, created_at, analysis_completed_at
                FROM analysis_results
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting recent analyses:', error);
            throw error;
        }
    }

    // Update S3 information for existing record
    async updateS3Information(uuid, s3Data) {
        try {
            await query(`
                UPDATE analysis_results 
                SET s3_url = $1, s3_key = $2, s3_bucket = $3, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $4
            `, [s3Data.s3Url, s3Data.s3Key, s3Data.s3Bucket, uuid]);
            
            console.log(`✅ Updated S3 information for analysis ${uuid}`);
        } catch (error) {
            console.error('❌ Error updating S3 information:', error);
            throw error;
        }
    }
    
    // Update analysis status
    async updateAnalysisStatus(uuid, status, errorMessage = null) {
        try {
            await query(`
                UPDATE analysis_results 
                SET status = $1, processing_error = $2, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $3
            `, [status, errorMessage, uuid]);
            
            console.log(`✅ Updated analysis ${uuid} status to: ${status}`);
        } catch (error) {
            console.error('❌ Error updating analysis status:', error);
            throw error;
        }
    }
    
    // Get statistics
    async getStatistics() {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_analyses,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed,
                    COUNT(*) FILTER (WHERE status = 'processing') as processing,
                    COUNT(*) FILTER (WHERE status = 'approved') as approved,
                    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                    COUNT(*) FILTER (WHERE violations_detected > 0) as with_violations,
                    AVG(confidence_score) as avg_confidence
                FROM analysis_results
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            `);
            
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error getting statistics:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();
