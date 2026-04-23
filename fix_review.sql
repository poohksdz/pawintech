-- SQL to fix the reviews column type and data in products table
-- Run this in phpMyAdmin

-- Step 1: Check current column type
DESCRIBE products;

-- Step 2: Change reviews column from INT to TEXT
ALTER TABLE products MODIFY COLUMN reviews TEXT;

-- Step 3: Now update product 33 with the correct JSON
UPDATE products SET reviews = '[{"name":"kridsada","rating":5,"comment":"5","user":49,"_id":"1776916934893","createdAt":"2026-04-23T04:02:14.893Z"}]' WHERE _id = 33;

-- Step 4: Verify
SELECT _id, name, reviews, rating, numReviews FROM products WHERE _id = 33;