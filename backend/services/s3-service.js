const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

class S3Service {
    constructor() {
        // Configure AWS S3
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
        });
        
        this.bucketName = process.env.S3_BUCKET_NAME || 'traffic-challan-images';
        
        // Test S3 connection on initialization
        this.testConnection();
    }
    
    async testConnection() {
        try {
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();
            console.log(`✅ S3 connection successful - Bucket: ${this.bucketName}`);
        } catch (error) {
            console.warn(`⚠️ S3 connection failed - Bucket: ${this.bucketName}`, error.message);
        }
    }
    
    /**
     * Upload image file to S3
     * @param {Buffer} fileBuffer - The image file buffer
     * @param {string} originalFilename - Original filename
     * @param {string} contentType - File MIME type
     * @param {string} analysisUuid - UUID of the analysis record
     * @returns {Promise<{s3Url: string, s3Key: string}>}
     */
    async uploadImage(fileBuffer, originalFilename, contentType, analysisUuid) {
        try {
            // Generate unique filename with analysis UUID
            const fileExtension = originalFilename.split('.').pop() || 'jpg';
            const s3Key = `traffic-images/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${analysisUuid}_${Date.now()}.${fileExtension}`;
            
            console.log(`📤 Uploading to S3: ${s3Key}`);
            
            const uploadParams = {
                Bucket: this.bucketName,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: contentType,
                Metadata: {
                    'original-filename': originalFilename,
                    'analysis-uuid': analysisUuid,
                    'upload-timestamp': new Date().toISOString()
                },
                // Make the object private (default)
                ACL: 'private'
            };
            
            const result = await this.s3.upload(uploadParams).promise();
            
            console.log(`✅ S3 upload successful: ${result.Location}`);
            
            return {
                s3Url: result.Location,
                s3Key: s3Key,
                bucket: this.bucketName
            };
            
        } catch (error) {
            console.error('❌ S3 upload failed:', error);
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }
    
    /**
     * Generate a presigned URL for secure image access
     * @param {string} s3Key - The S3 object key
     * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
     * @returns {Promise<string>} Presigned URL
     */
    async getPresignedUrl(s3Key, expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: s3Key,
                Expires: expiresIn
            };
            
            const url = await this.s3.getSignedUrlPromise('getObject', params);
            return url;
        } catch (error) {
            console.error('❌ Failed to generate presigned URL:', error);
            throw new Error(`Presigned URL generation failed: ${error.message}`);
        }
    }
    
    /**
     * Delete image from S3
     * @param {string} s3Key - The S3 object key
     * @returns {Promise<boolean>}
     */
    async deleteImage(s3Key) {
        try {
            await this.s3.deleteObject({
                Bucket: this.bucketName,
                Key: s3Key
            }).promise();
            
            console.log(`🗑️ Deleted S3 object: ${s3Key}`);
            return true;
        } catch (error) {
            console.error('❌ S3 delete failed:', error);
            return false;
        }
    }
    
    /**
     * Get image metadata from S3
     * @param {string} s3Key - The S3 object key
     * @returns {Promise<object>}
     */
    async getImageMetadata(s3Key) {
        try {
            const result = await this.s3.headObject({
                Bucket: this.bucketName,
                Key: s3Key
            }).promise();
            
            return {
                contentType: result.ContentType,
                contentLength: result.ContentLength,
                lastModified: result.LastModified,
                metadata: result.Metadata
            };
        } catch (error) {
            console.error('❌ Failed to get S3 metadata:', error);
            throw new Error(`S3 metadata retrieval failed: ${error.message}`);
        }
    }
    
    /**
     * Check if S3 service is properly configured
     * @returns {boolean}
     */
    isConfigured() {
        return !!(
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.S3_BUCKET_NAME
        );
    }
    
    /**
     * List recent images in S3 bucket
     * @param {number} maxKeys - Maximum number of objects to return
     * @returns {Promise<Array>}
     */
    async listRecentImages(maxKeys = 100) {
        try {
            const params = {
                Bucket: this.bucketName,
                MaxKeys: maxKeys,
                Prefix: 'traffic-images/'
            };
            
            const result = await this.s3.listObjectsV2(params).promise();
            
            return result.Contents.map(object => ({
                key: object.Key,
                size: object.Size,
                lastModified: object.LastModified,
                storageClass: object.StorageClass
            }));
        } catch (error) {
            console.error('❌ Failed to list S3 objects:', error);
            throw new Error(`S3 list operation failed: ${error.message}`);
        }
    }
}

module.exports = new S3Service();
