-- Migration: Create product_reviews table
-- This migration creates a separate table for product reviews

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    _id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to products table
    FOREIGN KEY (product_id) REFERENCES products(_id) ON DELETE CASCADE,
    -- Foreign key to users table
    FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE,
    
    -- Unique constraint: one user can only review one product once
    UNIQUE KEY unique_user_product (product_id, user_id),
    
    -- Index for faster queries
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display table structure
DESCRIBE product_reviews;

-- Sample data check (after migration)
-- SELECT pr.*, p.name as product_name, u.name as user_name 
-- FROM product_reviews pr
-- LEFT JOIN products p ON pr.product_id = p._id
-- LEFT JOIN users u ON pr.user_id = u._id
-- ORDER BY pr.created_at DESC;