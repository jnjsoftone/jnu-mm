// 전역 타임아웃 설정 (10초)
jest.setTimeout(10000);

// 콘솔 에러 무시 설정
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
}; 