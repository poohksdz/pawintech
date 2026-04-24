-- Update admin user with password 1234
UPDATE users
SET
  email = 'admin@gmail.com',
  password = '$2a$10$cfMp0GoxnJV9bOVeAJNIyuBndgUIvkKebb2wIMBmHHbJe/KJoO6ZO',
  name = 'Admin',
  isAdmin = 1,
  isStaff = 1,
  isStore = 1,
  isPCBAdmin = 1
WHERE email = 'admin@gmail.com' OR email = 'electotronix@gmail.com' OR isAdmin = 1;

-- Insert if not exists
INSERT INTO users (name, email, password, isAdmin, isStaff, isStore, isPCBAdmin, created_at)
SELECT 'Admin', 'admin@gmail.com', '$2a$10$cfMp0GoxnJV9bOVeAJNIyuBndgUIvkKebb2wIMBmHHbJe/KJoO6ZO', 1, 1, 1, 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com');