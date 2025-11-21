/**
 * 文件存储服务
 * 支持本地存储和OSS（对象存储服务）
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../config/logger');

// 存储配置
const STORAGE_CONFIG = {
  type: process.env.STORAGE_TYPE || 'local', // local | oss
  localPath: process.env.STORAGE_LOCAL_PATH || path.join(__dirname, '../public/videos'),
  oss: {
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET
  }
};

// 确保本地存储目录存在
async function ensureLocalDirectory() {
  if (STORAGE_CONFIG.type === 'local') {
    try {
      await fs.mkdir(STORAGE_CONFIG.localPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create storage directory', { error: error.message });
    }
  }
}

// 初始化存储
ensureLocalDirectory();

/**
 * 生成唯一文件名
 */
function generateFileName(originalName) {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}_${hash}${ext}`;
}

/**
 * 本地存储：保存文件
 */
async function saveLocalFile(file, subfolder = '') {
  try {
    const fileName = generateFileName(file.originalname);
    const folderPath = path.join(STORAGE_CONFIG.localPath, subfolder);
    const filePath = path.join(folderPath, fileName);
    
    await fs.mkdir(folderPath, { recursive: true });
    await fs.writeFile(filePath, file.buffer);
    
    return {
      success: true,
      fileName,
      filePath: `/videos/${subfolder}${subfolder ? '/' : ''}${fileName}`,
      absolutePath: filePath,
      size: file.size,
      type: 'local'
    };
  } catch (error) {
    logger.error('Failed to save local file', { error: error.message });
    throw error;
  }
}

/**
 * 本地存储：删除文件
 */
async function deleteLocalFile(filePath) {
  try {
    // 如果是相对路径，转换为绝对路径
    const absolutePath = filePath.startsWith('/')
      ? path.join(__dirname, '../public', filePath)
      : filePath;
    
    await fs.unlink(absolutePath);
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete local file', { error: error.message, filePath });
    return { success: false, error: error.message };
  }
}

/**
 * OSS存储：保存文件（需要安装ali-oss）
 */
async function saveOSSFile(file, subfolder = '') {
  // 这里需要根据实际使用的OSS服务实现
  // 示例使用阿里云OSS
  try {
    const OSS = require('ali-oss');
    const client = new OSS({
      region: STORAGE_CONFIG.oss.region,
      accessKeyId: STORAGE_CONFIG.oss.accessKeyId,
      accessKeySecret: STORAGE_CONFIG.oss.accessKeySecret,
      bucket: STORAGE_CONFIG.oss.bucket
    });
    
    const fileName = generateFileName(file.originalname);
    const objectName = subfolder ? `${subfolder}/${fileName}` : fileName;
    
    const result = await client.put(objectName, file.buffer);
    
    return {
      success: true,
      fileName,
      filePath: result.url,
      size: file.size,
      type: 'oss'
    };
  } catch (error) {
    logger.error('Failed to save OSS file', { error: error.message });
    throw error;
  }
}

/**
 * 保存文件（根据配置选择存储方式）
 */
async function saveFile(file, subfolder = '') {
  if (STORAGE_CONFIG.type === 'oss') {
    return await saveOSSFile(file, subfolder);
  } else {
    return await saveLocalFile(file, subfolder);
  }
}

/**
 * 删除文件
 */
async function deleteFile(filePath, fileType = 'local') {
  if (fileType === 'oss') {
    // OSS删除逻辑
    try {
      const OSS = require('ali-oss');
      const client = new OSS({
        region: STORAGE_CONFIG.oss.region,
        accessKeyId: STORAGE_CONFIG.oss.accessKeyId,
        accessKeySecret: STORAGE_CONFIG.oss.accessKeySecret,
        bucket: STORAGE_CONFIG.oss.bucket
      });
      
      const objectName = filePath.split('/').pop();
      await client.delete(objectName);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete OSS file', { error: error.message });
      return { success: false, error: error.message };
    }
  } else {
    return await deleteLocalFile(filePath);
  }
}

/**
 * 获取文件信息
 */
async function getFileInfo(filePath, fileType = 'local') {
  if (fileType === 'local') {
    try {
      const absolutePath = filePath.startsWith('/')
        ? path.join(__dirname, '../public', filePath)
        : filePath;
      
      const stats = await fs.stat(absolutePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return { exists: false };
    }
  }
  // OSS文件信息获取逻辑
  return { exists: true };
}

module.exports = {
  saveFile,
  deleteFile,
  getFileInfo,
  generateFileName,
  STORAGE_CONFIG
};

