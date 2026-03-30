const fs = require("fs");
const path = require("path");

/**
 * Safely deletes a file from the server disk.
 * @param {string} filePath - The relative or absolute path to the file.
 * @returns {boolean} - Returns true if deleted successfully or file didn't exist, false on error.
 */
const deleteFile = (filePath) => {
  if (!filePath) return true;

  try {
    // Resolve absolute path
    // If filePath starts with '/', it might be a URL-like path (/uploads/images/...)
    // We need to strip the leading '/' and join with process.cwd()
    const cleanPath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;
    const absolutePath = path.resolve(process.cwd(), cleanPath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`✅ Deleted file: ${absolutePath}`);
      return true;
    }
    return true; // File doesn't exist, count as success
  } catch (error) {
    console.error(`❌ Error deleting file (${filePath}):`, error.message);
    return false;
  }
};

module.exports = deleteFile;
