require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// สร้าง connection pool เพียงครั้งเดียว
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// สร้าง adapter
const adapter = new PrismaPg(pool);

// สร้าง Prisma Client เพียงครั้งเดียว
const prisma = new PrismaClient({ adapter });

module.exports = { prisma, pool };