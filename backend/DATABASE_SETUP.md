# PostgreSQL Database Integration Guide

This guide explains how to set up and use the PostgreSQL database integration for storing traffic challan analysis results.

## 🚀 Quick Setup

### 1. Install Dependencies

The required PostgreSQL dependencies are already included in `package.json`:

```bash
npm install
```

This will install:
- `pg` - PostgreSQL client for Node.js
- `uuid` - For generating unique identifiers

### 2. Configure Database Connection

Set your PostgreSQL connection string in your environment:

```bash
# Local PostgreSQL
export DATABASE_URL="postgresql://username:password@localhost:5432/traffic_challan"

# AWS RDS PostgreSQL
export DATABASE_URL="postgresql://username:password@your-db-host.region.rds.amazonaws.com:5432/traffic_challan"
```

Or create a `.env` file (copy from `env.example`):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/traffic_challan

# AWS S3 Configuration (optional but recommended)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=traffic-challan-images
```

### 3. Setup Database Tables

Run the database setup script:

```bash
npm run db:setup
```

This will create all necessary tables and indexes.

## 📊 Database Schema

### Main Tables

#### `analysis_results`
Stores the main analysis data for each processed image:

- **Basic Info**: `id`, `uuid`, `filename`, `file_size`, `content_type`
- **S3 Storage**: `s3_url`, `s3_key`, `s3_bucket` (AWS S3 image storage)
- **Officer Info**: `sector_officer_ps_name`, `sector_officer_cadre`, etc.
- **Vehicle Info**: `license_plate_number`, `vehicle_make`, `vehicle_model`, etc.
- **Analysis Results**: `quality_category`, `confidence_score`, `violations_detected`
- **Step Data**: `step1_quality_data` through `step6_violation_data` (JSON)
- **Status**: `status`, `processing_error`, timestamps

#### `violations`
Normalized violation details:

- Links to `analysis_results`
- Individual violation types with confidence scores

#### `rta_matches`
RTA comparison results:

- Parameter-by-parameter matching details
- RTA vs AI detected values

#### `officer_reviews`
Officer actions and reviews:

- Approval, rejection, or modification records
- Reason and modification details

## 🔄 How It Works

### 1. Image Analysis Flow

```
1. Image Upload → Create DB Record (processing status) + Upload to S3
2. AI Analysis → Update DB with results (completed status)
3. Officer Review → Record action in officer_reviews table
4. Final Status → approved/rejected/modified
```

### 2. Automatic Data Storage

When you upload an image via `/api/complete-analysis`, the system automatically:

1. **Creates a record** with unique UUID
2. **Uploads image to S3** (if configured) for permanent storage
3. **Stores file metadata** and officer information
4. **Updates with analysis results** from all 6 steps
5. **Tracks processing status** throughout the workflow

### 3. Data Structure Example

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "traffic_image.jpg",
  "license_plate_number": "TS09EA1234",
  "status": "completed",
  "violations_detected": 2,
  "step1_quality_data": { "quality_category": "GOOD", ... },
  "step6_violation_data": { "violations": ["No Helmet", "Signal Jump"] }
}
```

## 🌐 API Endpoints

### Analysis Operations

#### `POST /api/complete-analysis`
- **Function**: Analyzes image and stores results
- **Returns**: Analysis results + database UUID
- **Database**: Creates and updates analysis record

#### `POST /api/officer-review`
- **Function**: Records officer actions (approve/reject/modify)
- **Body**: `{ uuid, officerId, action, reason, modifications }`
- **Database**: Creates officer_reviews record, updates status

### Data Retrieval

#### `GET /api/analysis/:uuid`
- **Function**: Get specific analysis by UUID
- **Returns**: Complete analysis data

#### `GET /api/analyses?limit=50&offset=0`
- **Function**: Get recent analyses (paginated)
- **Returns**: List of analyses with metadata

#### `GET /api/statistics`
- **Function**: Get system statistics
- **Returns**: Counts, averages, trends

## 🔧 Configuration Options

### Connection Pool Settings

```javascript
// config/database.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds
});
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production  # Enables SSL for production
```

## 📈 Performance Considerations

### Indexes Created

The setup script creates optimized indexes for:

- `license_plate_number` - Fast license plate lookups
- `uploaded_at` - Time-based queries
- `officer_id` - Officer-specific queries
- `status` - Status filtering
- `uuid` - UUID lookups

### Query Optimization

- Use UUID for record identification (indexed)
- Pagination for large datasets (`LIMIT`/`OFFSET`)
- JSON fields for flexible step data storage
- Proper foreign key relationships for data integrity

## 🚨 Error Handling

The system gracefully handles database errors:

1. **Connection Issues**: Analysis continues without DB storage
2. **Insert Failures**: Logged but doesn't stop processing
3. **Update Failures**: Status marked as 'failed' with error details

## 🔒 Security Features

1. **Parameterized Queries**: Protection against SQL injection
2. **Connection Pooling**: Efficient resource management
3. **SSL Support**: Secure connections in production
4. **Error Sanitization**: Sensitive info not exposed in responses

## 📝 Maintenance Commands

```bash
# Setup database tables
npm run db:setup

# Reset database (recreates tables)
npm run db:reset

# Check connection (run server)
npm start
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED
   ```
   - Check if PostgreSQL is running
   - Verify `DATABASE_URL` is correct

2. **SSL Error**
   ```
   Error: self signed certificate
   ```
   - Set `NODE_ENV=production` for AWS RDS
   - Or modify SSL settings in config

3. **Permission Denied**
   ```
   Error: permission denied for table
   ```
   - Ensure database user has CREATE/INSERT/UPDATE permissions

### Logging

Database operations are logged with prefixes:
- `✅` - Success operations
- `❌` - Error operations  
- `⚠️` - Warning operations
- `💾` - Database operations

## 📊 Monitoring

Track your system performance:

1. **Analysis Volume**: `GET /api/statistics`
2. **Success Rates**: Check `status` distribution
3. **Processing Times**: Monitor `analysis_started_at` vs `analysis_completed_at`
4. **Officer Activity**: Query `officer_reviews` table

Your PostgreSQL database is now fully integrated with the Traffic Challan AI system! 🎉
