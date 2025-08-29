const AWS = require('aws-sdk');
const databaseService = require('./database-service');
require('dotenv').config({ path: '../.env' });

class S3MonitorService {
  constructor() {
    this.s3 = null;
    this.uploadBucket = 'traffic-violations-uploads-111'; // Android app upload bucket
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastCheckTime = new Date(); // Start monitoring from now
    
    // Configure AWS S3
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: this.region
      });
      this.s3 = new AWS.S3();
      console.log('✅ S3 Monitor Service configured for bucket:', this.uploadBucket);
    } else {
      console.warn('⚠️ AWS credentials not configured. S3 monitoring will be disabled.');
    }
  }

  isConfigured() {
    return !!this.s3;
  }

  async startMonitoring() {
    if (!this.isConfigured()) {
      console.warn('⚠️ S3 not configured. Cannot start monitoring.');
      return false;
    }

    if (this.isMonitoring) {
      console.log('📡 S3 monitoring already running');
      return true;
    }

    console.log('🚀 Starting S3 monitoring...');
    console.log(`📡 Monitoring bucket: ${this.uploadBucket}`);
    console.log(`⏱️ Check interval: 1 minute`);
    console.log(`📅 Starting from: ${this.lastCheckTime.toISOString()}`);
    
    this.isMonitoring = true;
    
    // Initial check
    await this.checkForNewImages();
    
    // Set up recurring check every 1 minute (60000 ms)
    this.monitoringInterval = setInterval(async () => {
      await this.checkForNewImages();
    }, 60000);

    return true;
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      return false;
    }

    console.log('⏹️ Stopping S3 monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    return true;
  }

  async checkForNewImages() {
    if (!this.isConfigured()) {
      console.log('❌ S3 not configured - cannot check for new images');
      return [];
    }

    try {
      console.log('🔍 Checking S3 for new images...');
      console.log(`📂 Bucket: ${this.uploadBucket}`);
      console.log(`📁 Prefix: uploads/`);
      console.log(`⏰ Last check time: ${this.lastCheckTime.toISOString()}`);
      
      // List objects in the uploads/ prefix, modified after lastCheckTime
      const params = {
        Bucket: this.uploadBucket,
        Prefix: 'uploads/',
        MaxKeys: 100 // Limit to prevent overwhelming
      };

      const data = await this.s3.listObjectsV2(params).promise();
      const currentTime = new Date();
      const newImages = [];

      console.log(`📊 Total objects found in bucket: ${data.Contents ? data.Contents.length : 0}`);
      
      if (data.Contents && data.Contents.length > 0) {
        console.log('📋 Recent objects in bucket:');
        data.Contents.forEach((obj, index) => {
          if (index < 5) { // Show first 5 for debugging
            console.log(`  ${index + 1}. ${obj.Key} - Modified: ${obj.LastModified.toISOString()} - Size: ${obj.Size}`);
          }
        });
        
        // Filter images uploaded after lastCheckTime
        const recentImages = data.Contents.filter(obj => {
          const isAfterLastCheck = obj.LastModified > this.lastCheckTime;
          const isJpg = obj.Key.toLowerCase().endsWith('.jpg'); // Handle both .jpg and .JPG
          const hasContent = obj.Size > 0;
          
          console.log(`🔍 Checking ${obj.Key}:`);
          console.log(`  - After last check (${obj.LastModified} > ${this.lastCheckTime}): ${isAfterLastCheck}`);
          console.log(`  - Is JPG: ${isJpg}`);
          console.log(`  - Has content: ${hasContent}`);
          
          return isAfterLastCheck && isJpg && hasContent;
        });

        console.log(`📊 Found ${recentImages.length} new images since last check`);

        // Process each new image
        for (const imageObj of recentImages) {
          try {
            // Parse the S3 key to extract metadata
            const metadata = this.parseS3Key(imageObj.Key);
            
            // Check if already processed (double-check against database)
            const isAlreadyProcessed = await this.isImageAlreadyProcessed(imageObj.Key);
            
            if (!isAlreadyProcessed) {
              const imageInfo = {
                s3Key: imageObj.Key,
                s3Bucket: this.uploadBucket,
                s3Url: `https://${this.uploadBucket}.s3.${this.region}.amazonaws.com/${imageObj.Key}`,
                size: imageObj.Size,
                lastModified: imageObj.LastModified,
                constableId: metadata.constableId,
                uploadDate: metadata.uploadDate,
                fileId: metadata.fileId,
                source: 'android_app_s3'
              };
              
              newImages.push(imageInfo);
              console.log(`📱 New S3 image queued: ${imageObj.Key}`);
            }
          } catch (error) {
            console.error(`❌ Error processing S3 image ${imageObj.Key}:`, error);
          }
        }
      }

      // Update last check time
      this.lastCheckTime = currentTime;
      
      // If we found new images, add them to processing queue
      if (newImages.length > 0) {
        await this.queueImagesForProcessing(newImages);
      }

      return newImages;

    } catch (error) {
      console.error('❌ Error checking S3 for new images:', error);
      return [];
    }
  }

  parseS3Key(s3Key) {
    // Parse: uploads/2024/01/15/constable123/uuid.jpg
    const parts = s3Key.split('/');
    
    if (parts.length >= 6) {
      return {
        uploadDate: `${parts[1]}/${parts[2]}/${parts[3]}`, // YYYY/MM/DD
        constableId: parts[4],
        fileId: parts[5].replace('.jpg', '')
      };
    }
    
    // Fallback for unexpected format
    return {
      uploadDate: new Date().toISOString().split('T')[0],
      constableId: 'unknown',
      fileId: s3Key.split('/').pop().replace('.jpg', '')
    };
  }

  async isImageAlreadyProcessed(s3Key) {
    try {
      // Check database for existing record with this S3 key
      const query = 'SELECT id FROM analysis_results WHERE s3_key = $1';
      const result = await databaseService.query(query, [s3Key]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Error checking if image already processed:', error);
      return false; // If unsure, assume not processed to avoid missing images
    }
  }

  async queueImagesForProcessing(imageInfoArray) {
    try {
      console.log(`🔄 Queuing ${imageInfoArray.length} S3 images for processing...`);
      
      // Import queue management service dynamically to avoid circular dependency
      const queueManagementService = require('./queue-management-service');
      
      for (const imageInfo of imageInfoArray) {
        try {
          // Download the image from S3
          const imageBuffer = await this.downloadImageFromS3(imageInfo.s3Key);
          
          // Create a database record to track this S3 image
          const analysisRecord = await databaseService.createAnalysisRecord({
            fileName: `${imageInfo.constableId}_${imageInfo.fileId}.jpg`,
            size: imageInfo.size,
            mimeType: 'image/jpeg',
            source: 'android_app_s3',
            constableId: imageInfo.constableId
          }, {
            s3Url: imageInfo.s3Url,
            s3Key: imageInfo.s3Key,
            s3Bucket: imageInfo.s3Bucket
          });

          // Add to the unified processing queue
          queueManagementService.addS3Image(imageInfo, imageBuffer, analysisRecord);
          
          console.log(`✅ S3 image queued successfully: ${imageInfo.s3Key}`);
          
        } catch (error) {
          console.error(`❌ Error queuing S3 image ${imageInfo.s3Key}:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error queuing images for processing:', error);
    }
  }

  async downloadImageFromS3(s3Key) {
    try {
      const params = {
        Bucket: this.uploadBucket,
        Key: s3Key
      };

      const data = await this.s3.getObject(params).promise();
      return data.Body;
    } catch (error) {
      console.error(`❌ Error downloading image from S3: ${s3Key}`, error);
      throw error;
    }
  }



  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      bucket: this.uploadBucket,
      lastCheckTime: this.lastCheckTime,
      isConfigured: this.isConfigured()
    };
  }

  // Reset last check time to process older images
  resetLastCheckTime(hoursBack = 24) {
    const newTime = new Date();
    newTime.setHours(newTime.getHours() - hoursBack);
    this.lastCheckTime = newTime;
    console.log(`⏰ Reset last check time to ${hoursBack} hours ago: ${this.lastCheckTime.toISOString()}`);
  }

  // Force check for images from a specific time
  async forceCheckFromTime(fromTime) {
    const originalTime = this.lastCheckTime;
    this.lastCheckTime = fromTime;
    
    try {
      const result = await this.checkForNewImages();
      console.log(`🔄 Force check found ${result.length} images from ${fromTime.toISOString()}`);
      return result;
    } finally {
      // Restore original time
      this.lastCheckTime = originalTime;
    }
  }

  async getRecentS3Images(limit = 20) {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const params = {
        Bucket: this.uploadBucket,
        Prefix: 'uploads/',
        MaxKeys: limit
      };

      const data = await this.s3.listObjectsV2(params).promise();
      
      if (data.Contents) {
        return data.Contents
          .filter(obj => obj.Key.endsWith('.jpg'))
          .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
          .slice(0, limit)
          .map(obj => ({
            s3Key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            metadata: this.parseS3Key(obj.Key)
          }));
      }

      return [];
    } catch (error) {
      console.error('❌ Error getting recent S3 images:', error);
      return [];
    }
  }
}

module.exports = new S3MonitorService();
