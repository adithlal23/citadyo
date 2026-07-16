/**
 * Citadyo File Uploader Utility
 * Isolates local file loading and base64 encoding to prepare payloads for Google Drive upload
 */

/**
 * Converts a file object to a base64-encoded string compatible with Google Apps Script Drive uploads.
 * 
 * @param {File} file - The standard HTML5 File object from an input field
 * @returns {Promise<object>} Object containing filename, mimeType, and base64 data
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      // The result format is: "data:<mimeType>;base64,<base64Data>"
      const parts = reader.result.split(',');
      if (parts.length < 2) {
        reject(new Error("Failed to parse base64 file data"));
        return;
      }
      
      const base64Str = parts[1];
      resolve({
        name: file.name,
        mimeType: file.type,
        base64: base64Str
      });
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}
