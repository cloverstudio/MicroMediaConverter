import { MmcOptions } from '../interfaces';

export interface MmcMessage {
  id: string;
  command: string;
  src?: string;
  result?: string;
  options?: MmcOptions;
}
