import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { UploadedFileDto } from '../dtos/uploaded-file.dto';

export const saveImage = async (
  file: Express.Multer.File,
  body: UploadedFileDto,
) => {
  try {
    const destination = body.folder
      ? path.join(process.cwd(), 'files', body.folder)
      : path.join(process.cwd(), 'files');

    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
      console.log(`📁 Folder created: ${destination}`);
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${randomStr}${ext}`;
    const filePath = path.join(destination, filename);

    console.log(`💾 Saving file: ${filePath}`);

    // ✅ بررسی نوع فایل
    const isImage = file.mimetype.startsWith('image/');

    if (isImage) {
      // ✅ پردازش تصویر با Sharp
      let sharpInstance = sharp(file.buffer);

      if (body.width || body.height) {
        const width = body.width || null;
        const height = body.height || null;
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        });
      } else {
        sharpInstance = sharpInstance.resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      await sharpInstance.toFile(filePath);
      const metadata = await sharp(filePath).metadata();

      const relativePath = body.folder
        ? `/files/${body.folder}/${filename}`
        : `/files/${filename}`;

      return {
        success: true,
        filename,
        filePath: relativePath,
        fullPath: filePath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        folder: body.folder || 'files',
        width: metadata.width,
        height: metadata.height,
      };
    } else {
      // ✅ ذخیره مستقیم فایل (غیرتصویری)
      await fs.promises.writeFile(filePath, file.buffer);

      const relativePath = body.folder
        ? `/files/${body.folder}/${filename}`
        : `/files/${filename}`;

      return {
        success: true,
        filename,
        filePath: relativePath,
        fullPath: filePath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        folder: body.folder || 'files',
        width: null,
        height: null,
      };
    }
  } catch (error) {
    console.error('❌ Error saving file:', error);
    throw new Error(`Error saving file: ${error.message}`);
  }
};

// ✅ تابع حذف فایل با پشتیبانی از fileName و folder
export const deleteImage = async (fileName: string, folder: string = '') => {
  try {
    const filePath = folder
      ? path.join(process.cwd(), 'files', folder, fileName)
      : path.join(process.cwd(), 'files', fileName);

    console.log(`🗑️ Deleting file: ${filePath}`);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`✅ File deleted successfully: ${fileName}`);
      return { 
        success: true, 
        message: 'File deleted successfully',
        filePath,
        fileName,
      };
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
      return { 
        success: false, 
        message: 'File not found',
        filePath,
        fileName,
      };
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return { 
      success: false, 
      message: error.message,
      fileName,
    };
  }
};

export const deleteImageByPath = async (imagePath: string) => {
  try {
    console.log(`🔍 Attempting to delete: ${imagePath}`);
    
    let fullPath = '';

    if (imagePath.startsWith('/files/')) {
      const relativePath = imagePath.replace('/files/', '');
      fullPath = path.join(process.cwd(), 'files', relativePath);
    } else if (imagePath.includes(':') || imagePath.startsWith('/')) {
      fullPath = imagePath;
    } else {
      const filesDir = path.join(process.cwd(), 'files');
      if (fs.existsSync(filesDir)) {
        const folders = fs.readdirSync(filesDir);
        let found = false;
        
        for (const folder of folders) {
          const folderPath = path.join(filesDir, folder);
          if (fs.statSync(folderPath).isDirectory()) {
            const filePath = path.join(folderPath, imagePath);
            if (fs.existsSync(filePath)) {
              fullPath = filePath;
              found = true;
              break;
            }
          }
        }
        
        if (!found) {
          const rootPath = path.join(filesDir, imagePath);
          if (fs.existsSync(rootPath)) {
            fullPath = rootPath;
          }
        }
      }
    }

    if (!fullPath) {
      console.log(`⚠️ Could not resolve path for: ${imagePath}`);
      return { success: false, message: 'Could not resolve file path' };
    }

    fullPath = fullPath.replace(/\\/g, '/');
    console.log(`🗑️ Deleting file: ${fullPath}`);

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      console.log(`✅ File deleted successfully: ${path.basename(fullPath)}`);
      return { success: true, message: 'File deleted successfully' };
    } else {
      console.log(`⚠️ File not found: ${fullPath}`);
      return { success: false, message: 'File not found' };
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return { success: false, message: error.message };
  }
};

export const deleteMultipleImages = async (imagePaths: string[]) => {
  try {
    const results = await Promise.all(
      imagePaths.map((path) => deleteImage(path)),
    );
    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error deleting multiple files:', error);
    throw new Error(`Error deleting multiple files: ${error.message}`);
  }
};

export const extractFileInfo = (filePath: string) => {
  if (!filePath) {
    return { fileName: '', folder: '' };
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (normalizedPath.startsWith('/files/')) {
    const relativePath = normalizedPath.replace('/files/', '');
    const parts = relativePath.split('/');
    
    if (parts.length === 1) {
      return { fileName: parts[0], folder: '' };
    } else {
      const fileName = parts.pop() || '';
      const folder = parts.join('/');
      return { fileName, folder };
    }
  }
  
  const fileName = path.basename(normalizedPath);
  const folder = path.dirname(normalizedPath);
  const folderParts = folder.split('/files/');
  const cleanFolder = folderParts.length > 1 ? folderParts[1] : '';
  
  return { fileName, folder: cleanFolder };
};