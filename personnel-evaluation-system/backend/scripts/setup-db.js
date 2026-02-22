#!/usr/bin/env node

/**
 * Database Setup Helper Script
 * ใช้สำหรับตรวจสอบและสร้าง Database ได้หลายวิธี
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'skills_db';

async function checkDatabaseConnection() {
  console.log('\n📊 Checking Database Connection...');
  console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`   User: ${DB_USER}`);
  
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    const [result] = await conn.query('SELECT 1 as test');
    await conn.end();
    
    console.log('✅ Database Server is running!\n');
    return true;
  } catch (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('❌ Database connection failed');
      console.log(`   Error: ${err.message}\n`);
    } else if (err.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to MySQL server');
      console.log('   Make sure MySQL is running on the specified host:port\n');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ Database authentication failed');
      console.log('   Check DB_USER and DB_PASSWORD in .env\n');
    }
    return false;
  }
}

async function createDatabase() {
  console.log(`📝 Creating Database "${DB_NAME}"...`);
  
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });
    
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    
    console.log(`✅ Database "${DB_NAME}" created/exists\n`);
    await conn.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed to create database: ${err.message}\n`);
    return false;
  }
}

async function applySchema() {
  console.log('⚙️  Applying Schema...\n');
  
  const schemaPath = path.resolve(__dirname, '../../schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.log(`❌ schema.sql not found at ${schemaPath}`);
    console.log(`   Trying alternate path...\n`);
  
  try {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
      database: DB_NAME
    });
    
    await conn.query(sql);
    console.log('✅ Schema applied successfully!\n');
    
    // ตรวจสอบ tables
    const [tables] = await conn.query(
      `SELECT COUNT(*) as count FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = '${DB_NAME}'`
    );
    
    console.log(`   Total tables created: ${tables[0].count}\n`);
    
    await conn.end();
    return true;
  } catch (err) {
    console.log(`❌ Schema apply failed: ${err.message}\n`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🚀 Personnel Evaluation System - DB Setup Helper');
  console.log('═══════════════════════════════════════════════════\n');
  
  // ตรวจสอบ connection
  const connected = await checkDatabaseConnection();
  
  if (!connected) {
    console.log('⚠️  Database Setup Options:\n');
    console.log('1️⃣  XAMPP');
    console.log('   - Download: https://www.apachefriends.org');
    console.log('   - Start MySQL service');
    console.log('   - Run this script again\n');
    
    console.log('2️⃣  Docker Desktop');
    console.log('   - Download: https://www.docker.com/products/docker-desktop');
    console.log('   - Install Docker');
    console.log('   - Run: docker-compose up -d');
    console.log('   - Update DB_HOST to "db" in .env\n');
    
    console.log('3️⃣  MySQL Server');
    console.log('   - Download: https://dev.mysql.com');
    console.log('   - Install and start MySQL');
    console.log('   - Run this script again\n');
    process.exit(1);
  }
  
  // สร้าง Database
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    process.exit(1);
  }
  
  // Apply Schema
  const schemaApplied = await applySchema();
  if (!schemaApplied) {
    process.exit(1);
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ Database Setup Complete!');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('🌐 You can now access:\n');
  console.log('   Frontend:     http://localhost:3000');
  console.log('   Backend API:  http://localhost:7000');
  console.log('   API Docs:     http://localhost:7000/api-docs');
  console.log('   phpMyAdmin:   http://localhost/phpmyadmin\n');
  
  console.log('👤 Demo Accounts (see DEMO_USERS.md):\n');
  console.log('   Admin:     admin@ccollege.ac.th / admin123');
  console.log('   Evaluator: eva.it@ccollege.ac.th / password123');
  console.log('   Teacher:   t.it01@ccollege.ac.th / demo123\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
