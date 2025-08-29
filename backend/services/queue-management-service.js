const stepAnalysisService = require('./step-analysis-service');
const databaseService = require('./database-service');
const s3MonitorService = require('./s3-monitor-service');

class QueueManagementService {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.currentlyProcessing = null;
    this.processedCount = 0;
    this.failedCount = 0;
    
    // Statistics
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      queued: 0,
      processing: 0
    };
  }

  // Add manual upload to queue
  addManualUpload(file, analysisRecord) {
    const queueItem = {
      id: analysisRecord.uuid,
      type: 'manual_upload',
      fileName: file.originalname,
      imageBuffer: file.buffer,
      analysisRecord: analysisRecord,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      source: 'manual'
    };

    this.processingQueue.push(queueItem);
    this.updateStats();
    
    console.log(`📤 Manual upload queued: ${file.originalname} (ID: ${queueItem.id})`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return queueItem;
  }

  // Add S3 image to queue
  addS3Image(imageInfo, imageBuffer, analysisRecord) {
    const queueItem = {
      id: analysisRecord.uuid,
      type: 's3_auto',
      fileName: `${imageInfo.constableId}_${imageInfo.fileId}.jpg`,
      imageBuffer: imageBuffer,
      analysisRecord: analysisRecord,
      imageInfo: imageInfo,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      source: 's3_android_app'
    };

    this.processingQueue.push(queueItem);
    this.updateStats();
    
    console.log(`📱 S3 image queued: ${imageInfo.s3Key} (ID: ${queueItem.id})`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return queueItem;
  }

  async startProcessing() {
    if (this.isProcessing) {
      console.log('⚡ Processing already running');
      return;
    }

    if (this.processingQueue.length === 0) {
      console.log('📭 No items in queue to process');
      return;
    }

    console.log(`🚀 Starting queue processing... (${this.processingQueue.length} items)`);
    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const queueItem = this.processingQueue.shift();
      await this.processQueueItem(queueItem);
    }

    console.log('✅ Queue processing completed');
    this.isProcessing = false;
    this.currentlyProcessing = null;
    this.updateStats();
  }

  async processQueueItem(queueItem) {
    try {
      console.log(`\n🔄 Processing ${queueItem.type}: ${queueItem.fileName}`);
      
      // Update status
      queueItem.status = 'processing';
      queueItem.processingStarted = new Date().toISOString();
      this.currentlyProcessing = queueItem;
      this.updateStats();

      // Run the complete analysis
      const workflowResult = await stepAnalysisService.runCompleteAnalysis(queueItem.imageBuffer);

      if (workflowResult.success) {
        // Update database with analysis results
        await databaseService.updateAnalysisResults(queueItem.analysisRecord.uuid, workflowResult);
        
        queueItem.status = 'completed';
        queueItem.processingCompleted = new Date().toISOString();
        queueItem.result = workflowResult;
        
        this.processedCount++;
        
        console.log(`✅ ${queueItem.type} processed successfully: ${queueItem.fileName}`);
        
        // Log specific results based on type
        if (queueItem.type === 's3_auto') {
          const finalAction = workflowResult.final_result?.action;
          console.log(`📱 S3 Image Result: ${finalAction}`);
          console.log(`🎯 License Plate: ${workflowResult.results?.step3?.data?.license_plate || 'Not extracted'}`);
          
          if (finalAction === 'NO_VIOLATIONS_DETECTED') {
            console.log('🏷️ → Will appear in "Violation Not Tagged" tab');
          } else if (finalAction === 'CHALLAN_READY') {
            console.log('⚠️ → Will appear in "Pending Review" tab');
          }
        }
        
      } else {
        queueItem.status = 'failed';
        queueItem.processingCompleted = new Date().toISOString();
        queueItem.error = workflowResult.error || 'Analysis failed';
        
        this.failedCount++;
        console.error(`❌ ${queueItem.type} processing failed: ${queueItem.fileName}`);
        console.error(`Error: ${queueItem.error}`);
      }

    } catch (error) {
      queueItem.status = 'failed';
      queueItem.processingCompleted = new Date().toISOString();
      queueItem.error = error.message;
      
      this.failedCount++;
      console.error(`💥 Error processing ${queueItem.type}: ${queueItem.fileName}`, error);
    }

    // Update statistics
    this.updateStats();
    
    // Add small delay between processing items to prevent overwhelming
    await this.delay(1000); // 1 second delay
  }

  updateStats() {
    const queued = this.processingQueue.filter(item => item.status === 'queued').length;
    const processing = this.isProcessing && this.currentlyProcessing ? 1 : 0;
    
    this.stats = {
      total: this.processedCount + this.failedCount + queued + processing,
      completed: this.processedCount,
      failed: this.failedCount,
      queued: queued,
      processing: processing
    };
  }

  getQueueStatus() {
    return {
      isProcessing: this.isProcessing,
      currentlyProcessing: this.currentlyProcessing,
      queueLength: this.processingQueue.length,
      stats: this.stats,
      queue: this.processingQueue.map(item => ({
        id: item.id,
        type: item.type,
        fileName: item.fileName,
        status: item.status,
        queuedAt: item.queuedAt,
        source: item.source
      }))
    };
  }

  pauseProcessing() {
    if (this.isProcessing) {
      console.log('⏸️ Pausing queue processing...');
      this.isProcessing = false;
      return true;
    }
    return false;
  }

  resumeProcessing() {
    if (!this.isProcessing && this.processingQueue.length > 0) {
      console.log('▶️ Resuming queue processing...');
      this.startProcessing();
      return true;
    }
    return false;
  }

  clearQueue() {
    const clearedCount = this.processingQueue.length;
    this.processingQueue = [];
    this.updateStats();
    
    console.log(`🗑️ Cleared ${clearedCount} items from queue`);
    return clearedCount;
  }

  removeFromQueue(itemId) {
    const initialLength = this.processingQueue.length;
    this.processingQueue = this.processingQueue.filter(item => item.id !== itemId);
    const removed = initialLength - this.processingQueue.length;
    
    if (removed > 0) {
      this.updateStats();
      console.log(`🗑️ Removed item ${itemId} from queue`);
    }
    
    return removed > 0;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Integration with S3 Monitor Service
  startS3Monitoring() {
    return s3MonitorService.startMonitoring();
  }

  stopS3Monitoring() {
    return s3MonitorService.stopMonitoring();
  }

  getS3MonitoringStatus() {
    return s3MonitorService.getMonitoringStatus();
  }

  async getRecentS3Images(limit = 20) {
    return await s3MonitorService.getRecentS3Images(limit);
  }

  // Get comprehensive system status
  getSystemStatus() {
    return {
      queue: this.getQueueStatus(),
      s3Monitoring: this.getS3MonitoringStatus(),
      totalProcessed: this.processedCount,
      totalFailed: this.failedCount
    };
  }
}

module.exports = new QueueManagementService();
