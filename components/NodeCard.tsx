
import React, { useRef, useState, useEffect } from 'react';
import { ImageState, ControlOption } from '../types';

interface NodeCardProps {
  title: string;
  imageState?: ImageState;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resultImage?: string | null;
  isActive?: boolean;
  type: 'input' | 'process' | 'output' | 'control' | 'text-input';
  onClick?: () => void;
  disabled?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void; 
  style?: React.CSSProperties;
  options?: ControlOption[];
  onOptionSelect?: (option: ControlOption) => void;
  selectedOptionId?: string | null;
  isMobile?: boolean;
  onPreview?: () => void;
  textValue?: string;
  onTextChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  textConfig?: {
      fontSize: string;
      onFontSizeChange: (size: string) => void;
      fontColor: string;
      onFontColorChange: (color: string) => void;
      fontFamily: string;
      onFontFamilyChange: (font: string) => void;
  };
}

export const NodeCard: React.FC<NodeCardProps> = ({
  title,
  imageState,
  onImageUpload,
  resultImage,
  isActive,
  type,
  onClick,
  disabled,
  onDragStart,
  onTouchStart,
  style,
  options,
  onOptionSelect,
  selectedOptionId,
  isMobile = false,
  onPreview,
  textValue,
  onTextChange,
  textConfig
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Zoom & Pan State (Output Only) ---
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset transform when resultImage changes
  useEffect(() => {
    if (resultImage) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [resultImage]);

  // --- Zoom & Pan Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    if (type !== 'output' || !resultImage) return;
    
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(1, scale + delta), 4);
    
    setScale(newScale);
    
    if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (type !== 'output' || !resultImage) return;
    
    if (scale > 1) {
        e.preventDefault();
        e.stopPropagation(); 
        setIsDraggingImage(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage) return;
    e.preventDefault();
    e.stopPropagation();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handleImageMouseUp = () => {
    setIsDraggingImage(false);
  };

  const handleImageWrapperClick = (e: React.MouseEvent) => {
      if (scale === 1 && onPreview) {
          e.stopPropagation();
          onPreview();
      }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
      e.stopPropagation();
      setScale(prev => Math.min(prev + 0.5, 4));
  };
  
  const handleZoomOut = (e: React.MouseEvent) => {
      e.stopPropagation();
      setScale(prev => {
          const newScale = Math.max(prev - 0.5, 1);
          if (newScale === 1) setPosition({x:0, y:0});
          return newScale;
      });
  };

  const handleReset = (e: React.MouseEvent) => {
      e.stopPropagation();
      setScale(1);
      setPosition({x:0, y:0});
  };

  const handleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPreview?.();
  };

  // --- Standard Logic ---
  const handleBoxClick = () => {
    if (type === 'input' && !imageState?.previewUrl && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (type === 'process' && onClick) {
        onClick();
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onImageUpload && fileInputRef.current) {
        fileInputRef.current.value = '';
        const event = {
            target: { files: null }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onImageUpload(event);
    }
  }

  const positionClass = "absolute"; 
  const sizeClass = isMobile ? "w-48 aspect-square" : "w-56 aspect-square";
  
  const baseClasses = `${positionClass} flex flex-col items-center rounded-2xl transition-shadow duration-300 border-2 overflow-hidden shadow-xl ${sizeClass}`;
  
  let typeClasses = "";
  if (type === 'input') {
    typeClasses = imageState?.previewUrl 
      ? "bg-brand-card border-brand-accent shadow-[0_0_15px_rgba(59,130,246,0.3)] justify-center" 
      : "bg-brand-card/50 border-slate-600 border-dashed hover:border-brand-accent hover:bg-brand-card/80 cursor-pointer justify-center";
  } else if (type === 'process') {
    typeClasses = isActive 
      ? "bg-brand-accent border-white shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-pulse justify-center" 
      : "bg-brand-card border-slate-600 hover:border-brand-accent hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:scale-105 cursor-pointer justify-center transition-all duration-300";
    if (disabled) typeClasses = "bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed justify-center";
  } else if (type === 'output') {
    typeClasses = resultImage 
        ? "bg-brand-card border-brand-success shadow-[0_0_20px_rgba(16,185,129,0.4)] justify-center" 
        : "bg-brand-card/30 border-slate-700 justify-center";
  } else if (type === 'control') {
      typeClasses = "bg-slate-800 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] justify-start";
  } else if (type === 'text-input') {
      typeClasses = "bg-slate-800 border-slate-600 shadow-md justify-start";
  }

  return (
    <div 
      className={`${baseClasses} ${typeClasses}`}
      style={style}
      onClick={type !== 'text-input' ? handleBoxClick : undefined}
    >
      {/* Header - Drag Handle */}
      <div 
        className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20 border-b border-white/10 cursor-move"
        style={{ touchAction: 'none' }} 
        onMouseDown={onDragStart}
        onTouchStart={onTouchStart}
      >
        <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider text-slate-300 select-none truncate px-2">
            {title}
        </span>
        <svg className="w-3 h-3 ml-1 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
      </div>

      {/* Input Content */}
      {type === 'input' && (
        <div className="w-full h-full pt-10">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImageUpload}
            accept="image/*"
            className="hidden"
          />
          {imageState?.previewUrl ? (
            <div className="relative w-full h-full p-2">
              <img 
                src={imageState.previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover rounded-xl"
              />
              <button 
                onClick={clearImage}
                className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs shadow-lg z-30"
              >
                ✕
              </button>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full pb-6 px-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 mb-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-400 text-[10px] md:text-xs">Clique para fazer upload</span>
             </div>
          )}
        </div>
      )}

      {/* Process Content */}
      {type === 'process' && (
        <div className="flex flex-col items-center justify-center p-4 pt-10 h-full w-full">
           {isActive ? (
             <svg className="animate-spin h-8 w-8 md:h-10 md:w-10 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 md:h-10 md:w-10 mb-2 ${disabled ? 'text-slate-600' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
             </svg>
           )}
           <span className={`text-[10px] md:text-xs font-bold text-center ${isActive ? 'text-white' : (disabled ? 'text-slate-600' : 'text-brand-accent')}`}>
              {isActive ? 'PROCESSANDO...' : 'EXECUTAR FUSÃO'}
           </span>
        </div>
      )}

      {/* Control Content */}
      {type === 'control' && options && (
          <div className="w-full h-full pt-12 pb-2 px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                  {options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={(e) => { e.stopPropagation(); onOptionSelect?.(opt); }}
                        className={`
                            flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all
                            ${selectedOptionId === opt.id 
                                ? 'bg-purple-600 border-purple-400 text-white shadow-md' 
                                : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-purple-400'}
                        `}
                      >
                          <span className="text-[9px] md:text-[10px] text-center leading-tight">{opt.label}</span>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Text Input Content (Updated) */}
      {type === 'text-input' && (
          <div className="w-full h-full pt-10 pb-2 px-2 flex flex-col gap-2">
              <textarea
                className="w-full flex-1 bg-slate-900/50 text-white text-xs p-2 rounded-lg resize-none focus:outline-none focus:border-brand-accent border border-transparent placeholder-slate-500 custom-scrollbar"
                placeholder="Digite data, hora, local..."
                value={textValue || ''}
                onChange={onTextChange}
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()}
              />
              {textConfig && (
                  <div className="flex flex-col gap-1 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                      <div className="flex gap-1">
                          <select 
                            value={textConfig.fontFamily}
                            onChange={(e) => textConfig.onFontFamilyChange(e.target.value)}
                            className="flex-1 bg-slate-900 text-[9px] text-white rounded px-1 py-1 border border-slate-600 focus:outline-none"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                              <option value="Original">Original (Clonar)</option>
                              <option value="Moderna Sans">Moderna Sans</option>
                              <option value="Serifa Clássica">Serifa Clássica</option>
                              <option value="Manuscrita">Manuscrita</option>
                              <option value="Impacto">Impacto (Bold)</option>
                          </select>
                      </div>
                      <div className="flex gap-1">
                          <select 
                            value={textConfig.fontSize}
                            onChange={(e) => textConfig.onFontSizeChange(e.target.value)}
                            className="flex-1 bg-slate-900 text-[9px] text-white rounded px-1 py-1 border border-slate-600 focus:outline-none"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                              <option value="Pequeno">Pequeno</option>
                              <option value="Médio">Médio</option>
                              <option value="Grande">Grande</option>
                              <option value="Gigante">Gigante</option>
                          </select>
                          <div className="flex items-center gap-1 bg-slate-900 px-1 rounded border border-slate-600 w-10 justify-center">
                              <input 
                                type="color" 
                                value={textConfig.fontColor}
                                onChange={(e) => textConfig.onFontColorChange(e.target.value)}
                                className="w-4 h-4 bg-transparent border-none cursor-pointer"
                                onMouseDown={(e) => e.stopPropagation()}
                              />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Output Content */}
      {type === 'output' && (
        <div className="w-full h-full pt-10 px-2 pb-2 flex flex-col">
            {resultImage ? (
                <div className="relative w-full h-full" onMouseLeave={handleImageMouseUp}>
                    
                    <div 
                      className={`w-full h-full relative overflow-hidden rounded-xl bg-black/40 ${scale === 1 ? 'cursor-zoom-in' : 'cursor-auto'}`}
                      onWheel={handleWheel}
                      onMouseDown={handleImageMouseDown}
                      onMouseMove={handleImageMouseMove}
                      onMouseUp={handleImageMouseUp}
                      onClick={handleImageWrapperClick}
                      title={scale === 1 ? "Clique para expandir" : ""}
                    >
                        <img 
                            src={resultImage} 
                            alt="Generated" 
                            className="w-full h-full object-contain transition-transform duration-75"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                cursor: scale > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : (scale === 1 ? 'pointer' : 'default')
                            }}
                            draggable={false}
                        />
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-30">
                         <button 
                            onClick={handleExpand}
                            className="bg-slate-800/80 hover:bg-slate-700 text-white p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-colors border border-slate-600"
                            title="Expandir"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                         </button>

                         <button 
                            onClick={handleZoomIn} 
                            className="bg-slate-800/80 hover:bg-slate-700 text-white p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-colors border border-slate-600"
                            title="Aumentar Zoom"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                         </button>
                         <button 
                            onClick={handleZoomOut} 
                            className="bg-slate-800/80 hover:bg-slate-700 text-white p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-colors border border-slate-600"
                            title="Diminuir Zoom"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                         </button>
                         <button 
                            onClick={handleReset} 
                            className="bg-slate-800/80 hover:bg-slate-700 text-white p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-colors border border-slate-600"
                            title="Resetar"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                         </button>
                    </div>

                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-30 w-max">
                         <a 
                            href={resultImage} 
                            download="vizualz-generated.png"
                            className="bg-brand-success hover:bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 transition-colors border border-emerald-500"
                            onClick={(e) => e.stopPropagation()}
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Baixar
                         </a>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    {isActive ? (
                        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <span className="text-slate-600 text-[10px] md:text-xs text-center px-4">O resultado aparecerá aqui</span>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};
