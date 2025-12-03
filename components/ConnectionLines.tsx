
import React from 'react';
import { ProcessingStatus, Position } from '../types';

interface ConnectionLinesProps {
  status: ProcessingStatus;
  hasResult: boolean;
  hasFinalResult: boolean;
  hasPoseResult: boolean;
  hasHairResult: boolean;
  showEditor: boolean;
  activeTab?: 'flow' | 'singer' | 'credits';
  positions: {
    person: Position;
    clothing: Position;
    process: Position;
    output: Position;
    editor?: Position;
    final?: Position;
    poseControl?: Position;
    poseOutput?: Position;
    hairControl?: Position;
    hairOutput?: Position;
  };
  singerPositions?: {
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
  hasSingerBaseResult?: boolean;
  hasSingerFinalResult?: boolean;
  hasSingerVariationResult?: boolean;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ 
    status, 
    hasResult, 
    hasFinalResult,
    hasPoseResult,
    hasHairResult,
    showEditor,
    activeTab = 'flow',
    positions,
    singerPositions,
    hasSingerBaseResult,
    hasSingerFinalResult,
    hasSingerVariationResult
}) => {
  const isProcessing = status === ProcessingStatus.PROCESSING;
  const isRefining = status === ProcessingStatus.REFINING;
  const isGeneratingPose = status === ProcessingStatus.GENERATING_POSE;
  const isGeneratingHair = status === ProcessingStatus.GENERATING_HAIR;
  
  const isGeneratingSingerSwap = status === ProcessingStatus.GENERATING_SINGER_SWAP;
  const isGeneratingFlyerText = status === ProcessingStatus.GENERATING_FLYER_TEXT;
  const isGeneratingSingerVar = status === ProcessingStatus.GENERATING_SINGER_VAR;
  
  const NODE_SIZE = 224; 
  
  const getCurve = (start: Position, end: Position) => {
      const midX = (start.x + end.x) / 2;
      return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
  };

  // --- SINGER FLOW RENDER ---
  if (activeTab === 'singer' && singerPositions) {
      // Step 1: Inputs -> Swap Process -> Base Result
      const pRef = { x: singerPositions.flyerRef.x + NODE_SIZE, y: singerPositions.flyerRef.y + NODE_SIZE / 2 };
      const pSinger = { x: singerPositions.singerImg.x + NODE_SIZE, y: singerPositions.singerImg.y + NODE_SIZE / 2 };
      
      const pSwapLeft = { x: singerPositions.processSwap.x, y: singerPositions.processSwap.y + NODE_SIZE / 2 };
      const pSwapRight = { x: singerPositions.processSwap.x + NODE_SIZE, y: singerPositions.processSwap.y + NODE_SIZE / 2 };
      
      const pBaseLeft = { x: singerPositions.baseResult.x, y: singerPositions.baseResult.y + NODE_SIZE / 2 };
      const pBaseRight = { x: singerPositions.baseResult.x + NODE_SIZE, y: singerPositions.baseResult.y + NODE_SIZE / 2 };

      // Step 2: Base Result + Data -> Text Process -> Final Output
      const pData = { x: singerPositions.eventData.x + NODE_SIZE, y: singerPositions.eventData.y + NODE_SIZE / 2 };
      
      const pTextProcLeft = { x: singerPositions.processText.x, y: singerPositions.processText.y + NODE_SIZE / 2 };
      const pTextProcRight = { x: singerPositions.processText.x + NODE_SIZE, y: singerPositions.processText.y + NODE_SIZE / 2 };
      
      const pFinalLeft = { x: singerPositions.finalOutput.x, y: singerPositions.finalOutput.y + NODE_SIZE / 2 };
      const pFinalRight = { x: singerPositions.finalOutput.x + NODE_SIZE, y: singerPositions.finalOutput.y + NODE_SIZE / 2 };

      // Paths Step 1
      const pathRef = getCurve(pRef, pSwapLeft);
      const pathSinger = getCurve(pSinger, pSwapLeft);
      const pathBase = getCurve(pSwapRight, pBaseLeft);

      // Paths Step 2
      const pathBaseToText = getCurve(pBaseRight, pTextProcLeft);
      const pathDataToText = getCurve(pData, pTextProcLeft);
      const pathFinal = getCurve(pTextProcRight, pFinalLeft);

      // Variation Paths
      let pathVarControl = "";
      let pathVarOutput = "";
      
      if (singerPositions.singerVariationControl && singerPositions.singerVariationOutput) {
          const pVarControlLeft = { x: singerPositions.singerVariationControl.x, y: singerPositions.singerVariationControl.y + NODE_SIZE / 2 };
          const pVarControlRight = { x: singerPositions.singerVariationControl.x + NODE_SIZE, y: singerPositions.singerVariationControl.y + NODE_SIZE / 2 };
          const pVarOutputLeft = { x: singerPositions.singerVariationOutput.x, y: singerPositions.singerVariationOutput.y + NODE_SIZE / 2 };
          
          pathVarControl = getCurve(pFinalRight, pVarControlLeft);
          pathVarOutput = getCurve(pVarControlRight, pVarOutputLeft);
      }

      return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <svg className="w-full h-full text-visible overflow-visible">
                <defs>
                    <linearGradient id="gradProcess" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="gradSingerVar" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {/* Static Lines */}
                <path d={pathRef} stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d={pathSinger} stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d={pathBase} stroke="#1e293b" strokeWidth="2" fill="none" />
                
                {hasSingerBaseResult && (
                    <>
                        <path d={pathBaseToText} stroke="#1e293b" strokeWidth="2" fill="none" />
                        <path d={pathDataToText} stroke="#1e293b" strokeWidth="2" fill="none" />
                        <path d={pathFinal} stroke="#1e293b" strokeWidth="2" fill="none" />
                    </>
                )}

                {hasSingerFinalResult && singerPositions.singerVariationControl && (
                    <>
                        <path d={pathVarControl} stroke="#1e293b" strokeWidth="2" fill="none" />
                        <path d={pathVarOutput} stroke="#1e293b" strokeWidth="2" fill="none" />
                    </>
                )}

                {/* Animated Lines - Step 1 */}
                <g opacity={isGeneratingSingerSwap ? 1 : 0.3} className="transition-opacity duration-500">
                    <path d={pathRef} stroke={isGeneratingSingerSwap ? "url(#gradProcess)" : "#334155"} strokeWidth={isGeneratingSingerSwap ? "3" : "2"} strokeDasharray={isGeneratingSingerSwap ? "8 4" : "0"} fill="none" className={isGeneratingSingerSwap ? "animate-flow" : ""} filter={isGeneratingSingerSwap ? "url(#glow)" : ""} />
                    <path d={pathSinger} stroke={isGeneratingSingerSwap ? "url(#gradProcess)" : "#334155"} strokeWidth={isGeneratingSingerSwap ? "3" : "2"} strokeDasharray={isGeneratingSingerSwap ? "8 4" : "0"} fill="none" className={isGeneratingSingerSwap ? "animate-flow" : ""} filter={isGeneratingSingerSwap ? "url(#glow)" : ""} />
                </g>

                <path d={pathBase} stroke={hasSingerBaseResult ? "#ec4899" : "#334155"} strokeWidth={hasSingerBaseResult ? "4" : "2"} fill="none" filter={hasSingerBaseResult ? "url(#glow)" : ""} className="transition-all duration-1000" />

                {/* Animated Lines - Step 2 */}
                {hasSingerBaseResult && (
                    <g opacity={isGeneratingFlyerText ? 1 : 0.3} className="transition-opacity duration-500">
                         <path d={pathBaseToText} stroke={isGeneratingFlyerText ? "url(#gradProcess)" : "#334155"} strokeWidth={isGeneratingFlyerText ? "3" : "2"} strokeDasharray={isGeneratingFlyerText ? "8 4" : "0"} fill="none" className={isGeneratingFlyerText ? "animate-flow" : ""} filter={isGeneratingFlyerText ? "url(#glow)" : ""} />
                         <path d={pathDataToText} stroke={isGeneratingFlyerText ? "url(#gradProcess)" : "#334155"} strokeWidth={isGeneratingFlyerText ? "3" : "2"} strokeDasharray={isGeneratingFlyerText ? "8 4" : "0"} fill="none" className={isGeneratingFlyerText ? "animate-flow" : ""} filter={isGeneratingFlyerText ? "url(#glow)" : ""} />
                    </g>
                )}
                
                {hasSingerBaseResult && (
                     <path d={pathFinal} stroke={hasSingerFinalResult ? "#ec4899" : "#334155"} strokeWidth={hasSingerFinalResult ? "4" : "2"} fill="none" filter={hasSingerFinalResult ? "url(#glow)" : ""} className="transition-all duration-1000" />
                )}

                {hasSingerFinalResult && singerPositions.singerVariationControl && (
                     <>
                        <path d={pathVarControl} stroke="#ec4899" strokeWidth="3" fill="none" filter="url(#glow)" />
                        <path d={pathVarOutput} stroke={hasSingerVariationResult ? "url(#gradSingerVar)" : "#334155"} strokeWidth={hasSingerVariationResult ? "4" : "2"} strokeDasharray={isGeneratingSingerVar ? "8 4" : "0"} fill="none" className={isGeneratingSingerVar ? "animate-flow" : ""} filter={hasSingerVariationResult || isGeneratingSingerVar ? "url(#glow)" : ""} />
                     </>
                )}
            </svg>
        </div>
      );
  }

  // --- STANDARD FLOW RENDER ---
  const p1 = { x: positions.person.x + NODE_SIZE, y: positions.person.y + NODE_SIZE / 2 };
  const p2 = { x: positions.clothing.x + NODE_SIZE, y: positions.clothing.y + NODE_SIZE / 2 };
  const pProcLeft = { x: positions.process.x, y: positions.process.y + NODE_SIZE / 2 };
  const pProcRight = { x: positions.process.x + NODE_SIZE, y: positions.process.y + NODE_SIZE / 2 };
  const pOutLeft = { x: positions.output.x, y: positions.output.y + NODE_SIZE / 2 };

  const pathTop = getCurve(p1, pProcLeft);
  const pathBot = getCurve(p2, pProcLeft);
  const pathOut = getCurve(pProcRight, pOutLeft);

  // --- Extended Flow (Editor -> Final) ---
  let pathEdit = "";
  let pathFinal = "";
  let pathPoseControl = "";
  let pathPoseOutput = "";
  let pathHairControl = "";
  let pathHairOutput = "";
  
  if (showEditor && positions.editor && positions.final && positions.poseControl && positions.poseOutput && positions.hairControl && positions.hairOutput) {
      const pOutRight = { x: positions.output.x + NODE_SIZE, y: positions.output.y + NODE_SIZE / 2 };
      
      // Path to Style Editor
      const pEditLeft = { x: positions.editor.x, y: positions.editor.y + NODE_SIZE / 2 };
      const pEditRight = { x: positions.editor.x + NODE_SIZE, y: positions.editor.y + NODE_SIZE / 2 };
      const pFinalLeft = { x: positions.final.x, y: positions.final.y + NODE_SIZE / 2 };
      
      pathEdit = getCurve(pOutRight, pEditLeft);
      pathFinal = getCurve(pEditRight, pFinalLeft);

      // Path to Pose Control
      const pPoseControlLeft = { x: positions.poseControl.x, y: positions.poseControl.y + NODE_SIZE / 2 };
      const pPoseControlRight = { x: positions.poseControl.x + NODE_SIZE, y: positions.poseControl.y + NODE_SIZE / 2 };
      const pPoseOutputLeft = { x: positions.poseOutput.x, y: positions.poseOutput.y + NODE_SIZE / 2 };

      pathPoseControl = getCurve(pOutRight, pPoseControlLeft);
      pathPoseOutput = getCurve(pPoseControlRight, pPoseOutputLeft);

      // Path to Hair Control
      const pHairControlLeft = { x: positions.hairControl.x, y: positions.hairControl.y + NODE_SIZE / 2 };
      const pHairControlRight = { x: positions.hairControl.x + NODE_SIZE, y: positions.hairControl.y + NODE_SIZE / 2 };
      const pHairOutputLeft = { x: positions.hairOutput.x, y: positions.hairOutput.y + NODE_SIZE / 2 };

      pathHairControl = getCurve(pOutRight, pHairControlLeft);
      pathHairOutput = getCurve(pHairControlRight, pHairOutputLeft);
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <svg className="w-full h-full text-visible overflow-visible">
        <defs>
          <linearGradient id="gradProcess" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
          </linearGradient>
          
          <linearGradient id="gradSuccess" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          
          <linearGradient id="gradRefine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          <linearGradient id="gradPose" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="gradHair" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <path d={pathTop} stroke="#1e293b" strokeWidth="2" fill="none" />
        <path d={pathBot} stroke="#1e293b" strokeWidth="2" fill="none" />
        <path d={pathOut} stroke="#1e293b" strokeWidth="2" fill="none" />
        
        {showEditor && (
            <>
                <path d={pathEdit} stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d={pathFinal} stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d={pathPoseControl} stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d={pathPoseOutput} stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d={pathHairControl} stroke="#1e293b" strokeWidth="2" fill="none" />
                <path d={pathHairOutput} stroke="#1e293b" strokeWidth="2" fill="none" />
            </>
        )}

        <g opacity={isProcessing ? 1 : 0.3} className="transition-opacity duration-500">
            <path d={pathTop} stroke={isProcessing ? "url(#gradProcess)" : "#334155"} strokeWidth={isProcessing ? "3" : "2"} strokeDasharray={isProcessing ? "8 4" : "0"} fill="none" className={isProcessing ? "animate-flow" : ""} filter={isProcessing ? "url(#glow)" : ""} />
            <path d={pathBot} stroke={isProcessing ? "url(#gradProcess)" : "#334155"} strokeWidth={isProcessing ? "3" : "2"} strokeDasharray={isProcessing ? "8 4" : "0"} fill="none" className={isProcessing ? "animate-flow" : ""} filter={isProcessing ? "url(#glow)" : ""} />
        </g>

        <path d={pathOut} stroke={hasResult ? "url(#gradSuccess)" : "#334155"} strokeWidth={hasResult ? "4" : "2"} fill="none" filter={hasResult ? "url(#glow)" : ""} className="transition-all duration-1000" />

        {showEditor && (
             <>
                <path d={pathEdit} stroke="url(#gradSuccess)" strokeWidth="3" fill="none" filter="url(#glow)" />
                <path d={pathFinal} stroke={hasFinalResult ? "url(#gradRefine)" : "#334155"} strokeWidth={hasFinalResult ? "4" : "2"} strokeDasharray={isRefining ? "8 4" : "0"} fill="none" className={isRefining ? "animate-flow" : ""} filter={hasFinalResult || isRefining ? "url(#glow)" : ""} />

                <path d={pathPoseControl} stroke="url(#gradSuccess)" strokeWidth="3" fill="none" filter="url(#glow)" />
                <path d={pathPoseOutput} stroke={hasPoseResult ? "url(#gradPose)" : "#334155"} strokeWidth={hasPoseResult ? "4" : "2"} strokeDasharray={isGeneratingPose ? "8 4" : "0"} fill="none" className={isGeneratingPose ? "animate-flow" : ""} filter={hasPoseResult || isGeneratingPose ? "url(#glow)" : ""} />

                <path d={pathHairControl} stroke="url(#gradSuccess)" strokeWidth="3" fill="none" filter="url(#glow)" />
                <path d={pathHairOutput} stroke={hasHairResult ? "url(#gradHair)" : "#334155"} strokeWidth={hasHairResult ? "4" : "2"} strokeDasharray={isGeneratingHair ? "8 4" : "0"} fill="none" className={isGeneratingHair ? "animate-flow" : ""} filter={hasHairResult || isGeneratingHair ? "url(#glow)" : ""} />
             </>
        )}

        {isProcessing && (
          <>
            <circle r="4" fill="#60a5fa" filter="url(#glow)">
              <animateMotion dur="1.5s" repeatCount="indefinite" path={pathTop} />
            </circle>
            <circle r="4" fill="#60a5fa" filter="url(#glow)">
              <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.2s" path={pathBot} />
            </circle>
          </>
        )}
        
        {hasResult && !isRefining && !isGeneratingPose && !isGeneratingHair && (
             <circle r="4" fill="#34d399" filter="url(#glow)">
              <animateMotion dur="3s" repeatCount="indefinite" path={pathOut} />
            </circle>
        )}
      </svg>
    </div>
  );
};
