// Test file to validate imports
try {
  const FileUpload = require('./src/pages/MaxSupply/components/FileUpload.jsx');
  console.log('FileUpload import successful:', typeof FileUpload);
} catch (error) {
  console.error('FileUpload import error:', error.message);
}
