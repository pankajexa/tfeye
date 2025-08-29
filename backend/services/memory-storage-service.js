/**
 * In-Memory Storage Service - Fallback when database is unavailable
 * WARNING: Data will be lost when server restarts
 */

class MemoryStorageService {
  constructor() {
    this.analyses = new Map();
    this.isEnabled = false;
    console.log('🧠 Memory Storage Service initialized (fallback mode)');
  }

  enable() {
    this.isEnabled = true;
    console.log('⚠️ MEMORY STORAGE ENABLED - Data will be lost on server restart!');
  }

  disable() {
    this.isEnabled = false;
  }

  // Mimic database service methods
  async createAnalysisRecord(fileData, officerData) {
    if (!this.isEnabled) throw new Error('Memory storage not enabled');

    const uuid = fileData.uuid || this.generateUUID();
    const record = {
      uuid,
      filename: fileData.filename,
      original_filename: fileData.originalname || fileData.filename,
      file_size: fileData.size || 0,
      content_type: fileData.mimetype || 'image/jpeg',
      analysis_status: 'processing',
      officer_id: officerData.officer_id,
      sector_officer_ps_name: officerData.sector_officer_ps_name,
      sector_officer_cadre: officerData.sector_officer_cadre,
      sector_officer_name: officerData.sector_officer_name,
      image_captured_by: officerData.image_captured_by,
      image_captured_by_officer_id: officerData.image_captured_by_officer_id,
      image_captured_officer_cadre: officerData.image_captured_officer_cadre,
      ps_jurisdiction_ps_name: officerData.ps_jurisdiction_ps_name,
      point_name: officerData.point_name,
      upload_source: fileData.upload_source || 'manual',
      s3_url: fileData.s3Url || null,
      s3_key: fileData.s3Key || null,
      s3_bucket: fileData.s3Bucket || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.analyses.set(uuid, record);
    console.log(`🧠 Memory: Created analysis record ${uuid}`);
    return record;
  }

  async updateAnalysisResults(uuid, analysisData) {
    if (!this.isEnabled) throw new Error('Memory storage not enabled');

    const record = this.analyses.get(uuid);
    if (!record) {
      throw new Error(`Analysis record ${uuid} not found in memory`);
    }

    // Update the record with analysis results
    Object.assign(record, {
      analysis_status: 'completed',
      step_results: JSON.stringify(analysisData.results || {}),
      final_result: JSON.stringify(analysisData.final_result || {}),
      license_plate_number: this.extractLicensePlate(analysisData),
      violation_types: this.extractViolations(analysisData),
      vehicle_owner: this.extractVehicleOwner(analysisData),
      vehicle_details: JSON.stringify(this.extractVehicleDetails(analysisData)),
      analysis_confidence: this.extractConfidence(analysisData),
      updated_at: new Date().toISOString()
    });

    this.analyses.set(uuid, record);
    console.log(`🧠 Memory: Updated analysis record ${uuid}`);
    return record;
  }

  async getAnalysisByUuid(uuid) {
    if (!this.isEnabled) throw new Error('Memory storage not enabled');

    const record = this.analyses.get(uuid);
    if (!record) {
      throw new Error(`Analysis record ${uuid} not found in memory`);
    }

    return record;
  }

  async getRecentAnalyses(limit = 50) {
    if (!this.isEnabled) throw new Error('Memory storage not enabled');

    const analyses = Array.from(this.analyses.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    return analyses;
  }

  async getStatistics() {
    if (!this.isEnabled) throw new Error('Memory storage not enabled');

    const analyses = Array.from(this.analyses.values());
    const total = analyses.length;
    const completed = analyses.filter(a => a.analysis_status === 'completed').length;
    const processing = analyses.filter(a => a.analysis_status === 'processing').length;
    const failed = analyses.filter(a => a.analysis_status === 'failed').length;

    return {
      total_analyses: total,
      completed_analyses: completed,
      processing_analyses: processing,
      failed_analyses: failed,
      success_rate: total > 0 ? (completed / total * 100).toFixed(2) : 0
    };
  }

  // Helper methods
  extractLicensePlate(analysisData) {
    return analysisData.results?.step3?.data?.license_plate || 
           analysisData.results?.step1?.data?.extracted_license_plate ||
           analysisData.final_result?.license_plate || null;
  }

  extractViolations(analysisData) {
    const violations = analysisData.results?.step2?.data?.violation_types || 
                      analysisData.final_result?.violation_types || [];
    return violations.length > 0 ? violations.join(', ') : null;
  }

  extractVehicleOwner(analysisData) {
    return analysisData.results?.step4?.data?.rta_data?.ownerName ||
           analysisData.final_result?.vehicle_owner || null;
  }

  extractVehicleDetails(analysisData) {
    return analysisData.results?.step5?.data?.visual_analysis || 
           analysisData.results?.step4?.data?.rta_data || {};
  }

  extractConfidence(analysisData) {
    return analysisData.results?.step3?.data?.confidence || 0.8;
  }

  generateUUID() {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Debug methods
  getAllData() {
    return Array.from(this.analyses.values());
  }

  clearAll() {
    this.analyses.clear();
    console.log('🧠 Memory: Cleared all analysis records');
  }

  getSize() {
    return this.analyses.size;
  }
}

module.exports = new MemoryStorageService();
