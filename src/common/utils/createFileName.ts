import { v4 } from 'uuid';

export function createFileName(fileName: string) {
  return v4() + ' ' + fileName;
}


