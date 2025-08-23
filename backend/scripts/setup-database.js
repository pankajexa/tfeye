#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script sets up the PostgreSQL database tables for the Traffic Challan system.
 * Run this script to initialize your database or create tables on a new environment.
 * 
 * Usage:
 *   node scripts/setup-database.js
 * 
 * Make sure to set your DATABASE_URL environment variable before running.
 */

require('dotenv').config();
const { setupDatabase, checkDatabaseConnection } = require('../config/db-setup');

async function main() {
    console.log('🚀 Traffic Challan Database Setup');
    console.log('================================');
    
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set');
        console.log('Please set your PostgreSQL connection string:');
        console.log('export DATABASE_URL="postgresql://username:password@host:port/database"');
        process.exit(1);
    }
    
    console.log('📋 Database URL:', process.env.DATABASE_URL.replace(/:([^:@]{8})[^:@]*@/, ':$1****@'));
    
    try {
        console.log('\n🔍 Testing database connection...');
        const isConnected = await checkDatabaseConnection();
        
        if (!isConnected) {
            console.error('❌ Failed to connect to database');
            console.log('Please check your DATABASE_URL and ensure PostgreSQL is running');
            process.exit(1);
        }
        
        console.log('✅ Database connection successful');
        
        console.log('\n🛠️  Creating database tables...');
        await setupDatabase();
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nTables created:');
        console.log('  • analysis_results (main analysis data)');
        console.log('  • violations (normalized violation details)');
        console.log('  • rta_matches (RTA comparison results)');
        console.log('  • officer_reviews (officer actions and reviews)');
        console.log('\nYour database is ready for use!');
        
    } catch (error) {
        console.error('\n❌ Database setup failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

// Run the setup
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
