import axios from 'axios';

const API_URL = 'https://product.tievista.com/api';

export const uploadPdf = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('pdfFile', file);

  try {
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) {
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  } catch (error) {
    console.error("API Upload Error:", error);
    throw error.response?.data || { error: 'Failed to upload PDF' };
  }
};
