const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData  = require('form-data');

// Fungsi untuk membaca semua file dari direktori dan mengembalikan daftar path file
function getFilePathsFromDirectory(directory) {
    return new Promise((resolve, reject) => {
      fs.readdir(directory, (err, files) => {
        if (err) {
          reject(err);
        } else {
          const filePaths = files.map(file => path.join(directory, file));
          resolve(filePaths);
        }
      });
    });
  }
  
  // Fungsi untuk mengupload file menggunakan Axios dengan data JSON
  async function uploadFiles(files, uploadUrl, outlet, type) {
    try {
      const form = new FormData();
  
      files.forEach(filePath => {
        form.append('myFile[]', fs.createReadStream(filePath));
      });
  
      form.append('outlet', outlet);
      form.append('type', type);
  
      const response = await axios.post(uploadUrl, form, {
        headers: {
          ...form.getHeaders(),
        },
      });
  
      console.log('Files uploaded successfully.');
      return response.data;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }
  
  // Fungsi utama untuk mendapatkan path file dan menguploadnya
  function uploadAllFiles(directory, uploadUrl, outlet, type) {
    return new Promise(async(resolve, reject)=>{
      try {
        const files = await getFilePathsFromDirectory(directory);
        const results = await uploadFiles(files, uploadUrl, outlet, type);
        console.log('All files uploaded successfully:', results);
        resolve(true)
      } catch (error) {
        reject(error)
      }
    })
  }
  
module.exports = uploadAllFiles;