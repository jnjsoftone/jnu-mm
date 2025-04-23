import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

/**
 * 오디오 파일에서 음성을 텍스트로 추출하는 함수
 * @param {string} audioPath - 오디오 파일 경로
 * @param {Object} options - 옵션
 * @param {string} options.model - 사용할 모델 (기본값: 'Xenova/whisper-small')
 * @param {string} options.language - 음성 언어 (기본값: 'ko')
 * @param {boolean} options.translate - 영어로 번역 여부 (기본값: false)
 * @returns {Promise<string>} - 추출된 텍스트
 */
export const transcribeAudio = async (
  audioPath: string,
  options: {
    model?: string;
    language?: string;
    translate?: boolean;
  } = {}
): Promise<string> => {
  try {
    const {
      model = 'Xenova/whisper-small',
      language = 'ko',
      translate = false
    } = options;

    console.log(`오디오 파일 처리 중: ${audioPath}`);
    console.log(`모델: ${model}, 언어: ${language}, 번역: ${translate ? '예' : '아니오'}`);

    // Whisper 파이프라인 생성
    const transcriber = await pipeline('automatic-speech-recognition', model);

    // 오디오 파일을 URL로 전달
    const result = await transcriber(audioPath, {
      language,
      task: translate ? 'translate' : 'transcribe'
    });

    // 결과 처리
    if (Array.isArray(result)) {
      return result[0].text || '';
    }
    return result.text || '';
  } catch (error: any) {
    console.error(`오디오 변환 실패: ${error.message}`);
    throw error;
  }
};

/**
 * 오디오 파일에서 음성을 텍스트로 추출하고 파일로 저장하는 함수
 * @param {string} audioPath - 오디오 파일 경로
 * @param {string} outputPath - 출력 파일 경로 (기본값: 오디오 파일과 같은 이름의 .txt 파일)
 * @param {Object} options - 옵션
 * @returns {Promise<string>} - 저장된 텍스트 파일 경로
 */
export const transcribeAudioToFile = async (
  audioPath: string,
  outputPath?: string,
  options: {
    model?: string;
    language?: string;
    translate?: boolean;
  } = {}
): Promise<string> => {
  try {
    // 텍스트 추출
    const text = await transcribeAudio(audioPath, options);

    // 출력 파일 경로 설정
    const finalOutputPath = outputPath || path.join(
      path.dirname(audioPath),
      `${path.basename(audioPath, path.extname(audioPath))}.txt`
    );

    // 텍스트 파일 저장
    fs.writeFileSync(finalOutputPath, text, 'utf8');

    console.log(`텍스트가 ${finalOutputPath}에 저장되었습니다.`);
    return finalOutputPath;
  } catch (error: any) {
    console.error(`오디오 변환 및 저장 실패: ${error.message}`);
    throw error;
  }
};

/**
 * 오디오 파일에서 음성을 텍스트로 추출하고 시간 정보와 함께 반환하는 함수
 * @param {string} audioPath - 오디오 파일 경로
 * @param {Object} options - 옵션
 * @returns {Promise<Array<{text: string, start: number, end: number}>>} - 시간 정보가 포함된 텍스트 배열
 */
export const transcribeAudioWithTimestamps = async (
  audioPath: string,
  options: {
    model?: string;
    language?: string;
    translate?: boolean;
  } = {}
): Promise<Array<{text: string, start: number, end: number}>> => {
  try {
    const {
      model = 'Xenova/whisper-small',
      language = 'ko',
      translate = false
    } = options;

    console.log(`오디오 파일 처리 중 (타임스탬프 포함): ${audioPath}`);

    // Whisper 파이프라인 생성
    const transcriber = await pipeline('automatic-speech-recognition', model);

    // 오디오 파일을 URL로 전달
    const result = await transcriber(audioPath, {
      language,
      task: translate ? 'translate' : 'transcribe',
      return_timestamps: true
    });

    // 결과 처리
    if (Array.isArray(result)) {
      return result[0].chunks?.map((chunk: any) => ({
        text: chunk.text,
        start: chunk.timestamp[0],
        end: chunk.timestamp[1]
      })) || [];
    }
    return result.chunks?.map((chunk: any) => ({
      text: chunk.text,
      start: chunk.timestamp[0],
      end: chunk.timestamp[1]
    })) || [];
  } catch (error: any) {
    console.error(`오디오 변환 실패 (타임스탬프 포함): ${error.message}`);
    throw error;
  }
};
