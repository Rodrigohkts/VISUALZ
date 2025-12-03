
export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  REFINING = 'REFINING',
  GENERATING_POSE = 'GENERATING_POSE',
  GENERATING_HAIR = 'GENERATING_HAIR',
  GENERATING_SINGER_SWAP = 'GENERATING_SINGER_SWAP',
  GENERATING_FLYER_TEXT = 'GENERATING_FLYER_TEXT',
  GENERATING_SINGER_VAR = 'GENERATING_SINGER_VAR'
}

export interface GenerationResult {
  imageUrl: string | null;
  error?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface ControlOption {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

export interface Coupon {
  code: string;
  value: number;
  isRedeemed: boolean;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface SavedFlowState {
  version: number;
  timestamp: number;
  credits?: number; 
  positions: {
    person: Position;
    clothing: Position;
    process: Position;
    output: Position;
    editor: Position;
    final: Position;
    poseControl: Position;
    poseOutput: Position;
    hairControl: Position;
    hairOutput: Position;
  };
  singerFlow?: {
      positions: {
          flyerRef: Position;
          singerImg: Position;
          processSwap: Position;
          baseResult: Position;
          eventData: Position;
          processText: Position;
          finalOutput: Position;
          singerVariationControl?: Position;
          singerVariationOutput?: Position;
      };
      text: string;
      textConfig?: {
          fontSize: string;
          fontColor: string;
          fontFamily: string;
      };
      images: {
          flyerRef: ImageState;
          singer: ImageState;
          baseResult: string | null;
          finalResult: string | null;
          variationResult?: string | null;
      };
  };
  images: {
    person: ImageState;
    clothing: ImageState;
    result: string | null;
    finalResult: string | null;
    poseResult: string | null;
    hairResult: string | null;
  };
  ui: {
    showExtendedFlow: boolean;
  };
}
