import exifr from "exifr";
import fs from "fs";
import path from "path";
import piexif from 'piexifjs';

/**
 * 이미지 파일에서 메타데이터를 추출하는 함수
 * @param {string} imagePath - 이미지 파일 경로
 * @param {Object} options - exifr 옵션
 * @returns {Promise<Object>} - 메타데이터 객체
 */
export const extractImageMetadata = async (imagePath: string, options: any = {}) => {
  try {
    const metadata = await exifr.parse(imagePath, options);
    return metadata;
  } catch (error: any) {
    console.error(`이미지 메타데이터 추출 실패: ${error.message}`);
    return {};
  }
};

/**
 * 이미지 파일에서 EXIF 데이터만 추출하는 함수
 * @param {string} imagePath - 이미지 파일 경로
 * @returns {Promise<Object>} - EXIF 데이터 객체
 */
export const extractExifData = async (imagePath: string) => {
  return extractImageMetadata(imagePath, { pick: ['ExifIFD'] });
};

/**
 * 이미지 파일에서 GPS 데이터만 추출하는 함수
 * @param {string} imagePath - 이미지 파일 경로
 * @returns {Promise<Object>} - GPS 데이터 객체
 */
export const extractGpsData = async (imagePath: string) => {
  return extractImageMetadata(imagePath, { pick: ['GPS'] });
};

/**
 * 이미지 파일에서 촬영 날짜/시간을 추출하는 함수
 * @param {string} imagePath - 이미지 파일 경로
 * @returns {Promise<Date|null>} - 촬영 날짜/시간
 */
export const extractImageDateTime = async (imagePath: string): Promise<Date | null> => {
  const metadata = await extractImageMetadata(imagePath, { pick: ['DateTimeOriginal', 'DateTime'] });
  if (metadata.DateTimeOriginal) {
    return metadata.DateTimeOriginal;
  } else if (metadata.DateTime) {
    return metadata.DateTime;
  }
  return null;
};

/**
 * 이미지 파일에서 카메라 정보를 추출하는 함수
 * @param {string} imagePath - 이미지 파일 경로
 * @returns {Promise<Object>} - 카메라 정보 객체
 */
export const extractCameraInfo = async (imagePath: string) => {
  return extractImageMetadata(imagePath, { 
    pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ISO', 'ExposureTime'] 
  });
};

/**
 * 이미지 메타데이터를 수정하여 새 파일로 저장하는 함수
 * @param {string} imagePath - 원본 이미지 파일 경로
 * @param {Object} metadata - 수정할 메타데이터
 * @param {string} outputPath - 저장할 파일 경로 (기본값: 원본 파일명에 '_modified' 접미사 추가)
 * @returns {Promise<string>} - 저장된 파일 경로
 */
export const modifyImageMetadata = async (
  imagePath: string, 
  metadata: Record<string, any>, 
  outputPath?: string
): Promise<string> => {
  try {
    // 원본 이미지 파일 읽기
    const imageBuffer = fs.readFileSync(imagePath);
    
    // 현재 메타데이터 읽기
    const currentMetadata = await exifr.parse(imageBuffer);
    
    // 메타데이터 병합
    const updatedMetadata = { ...currentMetadata, ...metadata };
    
    // 메타데이터를 이미지에 적용
    const exifStr = piexif.dump(updatedMetadata);
    const newImageData = piexif.insert(exifStr, imageBuffer.toString('base64'));
    
    // 임시 해결책: 메타데이터를 JSON 파일로 저장
    const metadataPath = outputPath 
      ? path.join(path.dirname(outputPath), `${path.basename(outputPath, path.extname(outputPath))}_metadata.json`)
      : path.join(path.dirname(imagePath), `${path.basename(imagePath, path.extname(imagePath))}_metadata.json`);
    
    fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    
    // 원본 이미지를 새 경로에 복사
    const finalOutputPath = outputPath || path.join(
      path.dirname(imagePath), 
      `${path.basename(imagePath, path.extname(imagePath))}_modified${path.extname(imagePath)}`
    );
    
    fs.writeFileSync(finalOutputPath, Buffer.from(newImageData, 'base64'));
    
    console.log(`메타데이터가 ${metadataPath}에 저장되었습니다.`);
    console.log(`수정된 이미지가 ${finalOutputPath}에 저장되었습니다.`);
    
    return finalOutputPath;
  } catch (error: any) {
    console.error(`이미지 메타데이터 수정 실패: ${error.message}`);
    throw error;
  }
};

/**
 * 이미지의 촬영 날짜/시간을 수정하는 함수
 * @param {string} imagePath - 원본 이미지 파일 경로
 * @param {Date} newDateTime - 새로운 촬영 날짜/시간
 * @param {string} outputPath - 저장할 파일 경로 (선택 사항)
 * @returns {Promise<string>} - 저장된 파일 경로
 */
export const modifyImageDateTime = async (
  imagePath: string, 
  newDateTime: Date, 
  outputPath?: string
): Promise<string> => {
  return modifyImageMetadata(imagePath, {
    DateTimeOriginal: newDateTime,
    DateTime: newDateTime
  }, outputPath);
};