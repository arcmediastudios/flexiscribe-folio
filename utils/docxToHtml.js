const mammoth = require("mammoth");

async function docxToHtml(docxPath) {
    try {
      const result = await mammoth.convertToHtml({ path: docxPath });
      return result.value; // The generated HTML
    } catch (error) {
      console.error("Error converting DOCX to HTML:", error);
      throw error;
    }
  }
  
module.exports = docxToHtml;
