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
  
  async function uploadFiles(files, uploadUrl, outlet, type) {
    return new Promise(async(resolve, reject)=>{
      try {
        const form = new FormData();
    
        files.forEach(filePath => {
          form.append('myFile[]', fs.createReadStream(filePath));
        });
    
        form.append('outlet', outlet);
        form.append('type', type);
        form.append('version', '240801');
    
        const response = await axios.post(uploadUrl, form, {
          headers: {
            ...form.getHeaders(),
          },
        });
    
        resolve(response.data);
      } catch (error) {
        reject(error)
      }
    })
  }
  
  // Fungsi utama untuk mendapatkan path file dan menguploadnya
  function uploadAllFiles(directory, uploadUrl, outlet, type) {
    return new Promise(async(resolve, reject)=>{
      try {
        const files = await getFilePathsFromDirectory(directory);
        const results =  uploadFiles(files, uploadUrl, outlet, type);
        resolve(results)
      } catch (error) {
        reject(error)
      }
    })
  }
  
module.exports = uploadAllFiles;