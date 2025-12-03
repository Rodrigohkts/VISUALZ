
import React, { useState, useRef, useEffect } from 'react';
import { NodeCard } from './components/NodeCard';
import { ConnectionLines } from './components/ConnectionLines';
import { ImageState, ProcessingStatus, Position, ControlOption, SavedFlowState, Coupon, UserProfile } from './types';
import { generateOutfitSwap, refineImage, generatePoseVariation, generateHairVariation, generateSingerSwap, applyFlyerText, generateSingerVariation } from './services/geminiService';

declare global {
  interface Window {
    google: any;
  }
}

const STYLE_OPTIONS: ControlOption[] = [
    { id: 'bg_studio', label: 'Fundo: Estúdio', prompt: 'substitua o fundo por um estúdio fotográfico minimalista profissional' },
    { id: 'bg_street', label: 'Fundo: Rua Urbana', prompt: 'substitua o fundo por uma rua urbana moderna e desfocada (bokeh)' },
    { id: 'bg_beach', label: 'Fundo: Praia', prompt: 'substitua o fundo por uma praia paradisíaca ensolarada' },
    { id: 'bg_christmas', label: 'Fundo: Natal', prompt: 'substitua o fundo por um cenário natalino mágico e sofisticado, com árvore de natal iluminada ao fundo, luzes douradas e clima aconchegante' },
    { id: 'bg_cyber', label: 'Estilo: Cyberpunk', prompt: 'adicione uma atmosfera cyberpunk neon futurista ao ambiente' },
    { id: 'light_sunset', label: 'Luz: Pôr do Sol', prompt: 'altere a iluminação para a hora dourada do pôr do sol' },
    { id: 'style_vintage', label: 'Filtro: Vintage', prompt: 'aplique uma estética de fotografia de filme vintage anos 90' },
];

const POSE_OPTIONS: ControlOption[] = [
    { id: 'pose_walking', label: 'Andando', prompt: 'andando em direção à câmera com confiança, estilo desfile' },
    { id: 'pose_sitting', label: 'Sentado', prompt: 'sentado de forma relaxada e elegante em um banco ou cadeira invisível' },
    { id: 'pose_hands_hip', label: 'Mão na Cintura', prompt: 'em pé com as mãos na cintura, pose clássica de poder' },
    { id: 'pose_side', label: 'Perfil', prompt: 'de perfil lateral olhando para o horizonte' },
    { id: 'pose_back', label: 'Costas', prompt: 'de costas, virando levemente a cabeça para olhar por cima do ombro' },
    { id: 'pose_arms_crossed', label: 'Braços Cruzados', prompt: 'em pé com os braços cruzados e atitude confiante' },
];

const HAIR_OPTIONS: ControlOption[] = [
    { id: 'hair_fem_wavy', label: 'Fem: Longo Ondulado', prompt: 'cabelo longo, solto e com ondas naturais volumosas' },
    { id: 'hair_fem_bob', label: 'Fem: Bob Curto', prompt: 'corte de cabelo bob curto e moderno, na altura do queixo' },
    { id: 'hair_fem_bun', label: 'Fem: Coque Elegante', prompt: 'cabelo preso em um coque alto e elegante' },
    { id: 'hair_fem_bangs', label: 'Fem: Com Franja', prompt: 'cabelo liso com franja reta na altura da sobrancelha' },
    { id: 'hair_masc_fade', label: 'Masc: Degradê (Fade)', prompt: 'corte masculino com degradê (fade) clássico nas laterais e volume moderado no topo' },
    { id: 'hair_masc_taper', label: 'Masc: Taper Fade', prompt: 'corte masculino estilo Taper Fade, com as laterais diminuindo gradualmente e acabamento limpo' },
    { id: 'hair_masc_undercut', label: 'Masc: Undercut', prompt: 'corte masculino Undercut, com laterais raspadas e topo longo penteado para trás' },
    { id: 'hair_masc_buzz', label: 'Masc: Buzz Cut', prompt: 'corte masculino Buzz Cut, cabelo raspado bem curto estilo militar' },
    { id: 'hair_masc_sidepart', label: 'Masc: Side Part (Social)', prompt: 'corte masculino clássico Side Part (Social) com divisão lateral elegante e bem definida' },
    { id: 'hair_masc_quiff', label: 'Masc: Quiff / Topete', prompt: 'corte masculino com Topete Moderno (Quiff) volumoso, texturizado e estilizado para cima' },
    { id: 'hair_masc_curly_fade', label: 'Masc: Cacheado c/ Fade', prompt: 'corte masculino para cabelo cacheado natural no topo com degradê (fade) nas laterais' },
    { id: 'hair_masc_crop', label: 'Masc: Textured Crop', prompt: 'corte masculino Textured Crop com franja curta reta e bastante textura no topo' },
];

const SINGER_VARIATION_OPTIONS: ControlOption[] = [
    { id: 'singer_fem', label: 'Cantora Sertaneja (M)', prompt: 'uma cantora sertaneja mulher carismática, segurando microfone' },
    { id: 'singer_masc', label: 'Cantor Sertanejo (H)', prompt: 'um cantor sertanejo homem carismático, com chapéu e violão' },
    { id: 'singer_duo', label: 'Dupla Sertaneja', prompt: 'uma dupla sertaneja de dois homens cantando juntos' },
    { id: 'singer_dj', label: 'DJ Moderno', prompt: 'um DJ moderno com fones de ouvido e óculos escuros' },
    { id: 'singer_piseiro', label: 'Cantor de Piseiro', prompt: 'um cantor de piseiro com teclado e boné para trás' },
    { id: 'singer_pop', label: 'Cantor Pop', prompt: 'um cantor estilo pop moderno e estiloso' },
];

const DEFAULT_POSITIONS = {
    person: { x: 40, y: 80 },
    clothing: { x: 40, y: 360 },
    process: { x: 350, y: 220 },
    output: { x: 650, y: 220 },
    editor: { x: 950, y: 80 }, 
    final: { x: 1250, y: 80 },
    poseControl: { x: 950, y: 340 },
    poseOutput: { x: 1250, y: 340 },
    hairControl: { x: 950, y: 600 },
    hairOutput: { x: 1250, y: 600 }
};

const DEFAULT_SINGER_POSITIONS = {
    flyerRef: { x: 40, y: 40 },
    singerImg: { x: 40, y: 320 },
    processSwap: { x: 300, y: 180 },
    baseResult: { x: 550, y: 180 },
    eventData: { x: 550, y: 500 },
    processText: { x: 850, y: 340 },
    finalOutput: { x: 1100, y: 340 },
    singerVariationControl: { x: 1100, y: 620 },
    singerVariationOutput: { x: 1400, y: 620 }
};

const COST_BASE_SWAP = 3;
const COST_TEXT_EDIT = 1;
const COST_VARIATION = 1;

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>({
      id: 'guest_user',
      name: 'Visitante',
      email: 'guest@vizualz.local',
      avatar: 'https://ui-avatars.com/api/?name=VIZUALZ&background=0f172a&color=3b82f6&bold=true'
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- App State ---
  const [activeTab, setActiveTab] = useState<'flow' | 'singer' | 'credits'>('flow');
  
  // Studio Flow State
  const [personImage, setPersonImage] = useState<ImageState>({ file: null, previewUrl: null, base64: null });
  const [clothingImage, setClothingImage] = useState<ImageState>({ file: null, previewUrl: null, base64: null });
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [finalResultImage, setFinalResultImage] = useState<string | null>(null);
  const [poseResultImage, setPoseResultImage] = useState<string | null>(null);
  const [hairResultImage, setHairResultImage] = useState<string | null>(null);

  // Singer Flow State
  const [flyerRefImage, setFlyerRefImage] = useState<ImageState>({ file: null, previewUrl: null, base64: null });
  const [singerImage, setSingerImage] = useState<ImageState>({ file: null, previewUrl: null, base64: null });
  const [eventDetails, setEventDetails] = useState<string>('');
  const [eventFontSize, setEventFontSize] = useState<string>('Médio');
  const [eventFontColor, setEventFontColor] = useState<string>('#FFFFFF');
  const [eventFontFamily, setEventFontFamily] = useState<string>('Original');

  const [flyerBaseResult, setFlyerBaseResult] = useState<string | null>(null); // Image after swapping singer
  const [flyerFinalResult, setFlyerFinalResult] = useState<string | null>(null); // Final image after text
  const [singerVariationResultImage, setSingerVariationResultImage] = useState<string | null>(null);
  
  // Common State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [selectedPose, setSelectedPose] = useState<string | null>(null);
  const [selectedHair, setSelectedHair] = useState<string | null>(null);
  const [selectedSingerVar, setSelectedSingerVar] = useState<string | null>(null);

  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const keyBufferRef = useRef<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        keyBufferRef.current = [...keyBufferRef.current, e.key].slice(-5);
        if (keyBufferRef.current.join('') === '41417') {
            setIsAdminVisible(prev => !prev);
            keyBufferRef.current = []; 
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getStorageKeys = (userId: string) => ({
    credits: `styleSwap_credits_${userId}`,
    coupons: `styleSwap_coupons_${userId}`,
    pos: `styleSwap_pos_${userId}`
  });

  const [credits, setCredits] = useState<number>(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redeemCode, setRedeemCode] = useState('');

  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [singerPositions, setSingerPositions] = useState(DEFAULT_SINGER_POSITIONS);
  const [showExtendedFlow, setShowExtendedFlow] = useState(false);

  useEffect(() => {
      if (user) {
          const keys = getStorageKeys(user.id);
          const savedCredits = localStorage.getItem(keys.credits);
          setCredits(savedCredits ? parseInt(savedCredits, 10) : 10);
          const savedCoupons = localStorage.getItem(keys.coupons);
          setCoupons(savedCoupons ? JSON.parse(savedCoupons) : []);
          const savedPos = localStorage.getItem(keys.pos);
          if (savedPos) {
              setPositions({ ...DEFAULT_POSITIONS, ...JSON.parse(savedPos) });
          } else {
              setPositions(DEFAULT_POSITIONS);
          }
      }
  }, [user]);

  useEffect(() => {
      if (user) {
          const keys = getStorageKeys(user.id);
          localStorage.setItem(keys.credits, credits.toString());
      }
  }, [credits, user]);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Common drag handler helper
  const updatePosition = (id: string, newX: number, newY: number) => {
      if (activeTab === 'singer') {
          setSingerPositions(prev => ({ ...prev, [id]: { x: newX, y: newY } }));
      } else {
          setPositions(prev => ({ ...prev, [id]: { x: newX, y: newY } }));
      }
  };

  const handleDragStart = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
      e.preventDefault();
      draggingRef.current = { id, offsetX: e.clientX - currentX, offsetY: e.clientY - currentY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const { id, offsetX, offsetY } = draggingRef.current;
      updatePosition(id, e.clientX - offsetX, e.clientY - offsetY);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string, currentX: number, currentY: number) => {
      const touch = e.touches[0];
      draggingRef.current = { id, offsetX: touch.clientX - currentX, offsetY: touch.clientY - currentY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!draggingRef.current) return;
      if (e.cancelable) e.preventDefault(); 
      const touch = e.touches[0];
      const { id, offsetX, offsetY } = draggingRef.current;
      updatePosition(id, touch.clientX - offsetX, touch.clientY - offsetY);
  };
  
  const handleTouchEnd = () => { draggingRef.current = null; };
  const handleMouseUp = () => { draggingRef.current = null; };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<ImageState>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter({ file, previewUrl: URL.createObjectURL(file), base64: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
        setter({ file: null, previewUrl: null, base64: null });
    }
  };

  const checkCredits = (cost: number) => {
      if (credits < cost) {
          setErrorMessage(`Créditos insuficientes! Você precisa de ${cost} créditos.`);
          return false;
      }
      return true;
  };

  const deductCredits = (cost: number) => {
      setCredits(prev => Math.max(0, prev - cost));
  };

  const processSwap = async () => {
    if (!personImage.base64 || !clothingImage.base64) return;
    if (!checkCredits(COST_BASE_SWAP)) return;

    setStatus(ProcessingStatus.PROCESSING);
    setErrorMessage(null);
    setResultImage(null);
    setFinalResultImage(null);
    setShowExtendedFlow(false);

    try {
      const generatedImage = await generateOutfitSwap(personImage.base64, clothingImage.base64);
      deductCredits(COST_BASE_SWAP); 
      setResultImage(generatedImage);
      setStatus(ProcessingStatus.SUCCESS);
      setTimeout(() => setShowExtendedFlow(true), 500);
    } catch (error: any) {
      setStatus(ProcessingStatus.ERROR);
      setErrorMessage(error.message || "Erro desconhecido.");
    }
  };

  // STEP 1: Swap Singer
  const processSingerSwap = async () => {
    if (!flyerRefImage.base64 || !singerImage.base64) {
        setErrorMessage("Carregue o Flyer e o Cantor primeiro.");
        return;
    }
    if (!checkCredits(COST_BASE_SWAP)) return;

    setStatus(ProcessingStatus.GENERATING_SINGER_SWAP);
    setErrorMessage(null);
    setFlyerBaseResult(null);
    setFlyerFinalResult(null); 

    try {
        const generatedFlyer = await generateSingerSwap(
            flyerRefImage.base64, 
            singerImage.base64
        );
        deductCredits(COST_BASE_SWAP);
        setFlyerBaseResult(generatedFlyer);
        setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
        setStatus(ProcessingStatus.ERROR);
        setErrorMessage(error.message);
    }
  };

  // STEP 2: Apply Text
  const processFlyerText = async () => {
      if (!flyerBaseResult || !eventDetails) {
          setErrorMessage("Gere o flyer com o cantor e preencha os dados do evento.");
          return;
      }
      if (!checkCredits(COST_TEXT_EDIT)) return;

      setStatus(ProcessingStatus.GENERATING_FLYER_TEXT);
      setErrorMessage(null);
      setFlyerFinalResult(null);

      try {
          const finishedFlyer = await applyFlyerText(
              flyerBaseResult,
              eventDetails,
              eventFontSize,
              eventFontColor,
              eventFontFamily
          );
          deductCredits(COST_TEXT_EDIT);
          setFlyerFinalResult(finishedFlyer);
          setStatus(ProcessingStatus.SUCCESS);
      } catch (error: any) {
          setStatus(ProcessingStatus.ERROR);
          setErrorMessage(error.message);
      }
  };

  const isBusy = status !== ProcessingStatus.IDLE && status !== ProcessingStatus.SUCCESS && status !== ProcessingStatus.ERROR;

  const handleStyleSelect = async (option: ControlOption) => {
      if (!resultImage || isBusy || !checkCredits(COST_VARIATION)) return;
      setSelectedControl(option.id);
      setStatus(ProcessingStatus.REFINING);
      setFinalResultImage(null); 
      try {
          const refined = await refineImage(resultImage, option.prompt);
          deductCredits(COST_VARIATION);
          setFinalResultImage(refined);
          setStatus(ProcessingStatus.SUCCESS);
      } catch (error: any) {
          setStatus(ProcessingStatus.ERROR);
          setErrorMessage(error.message);
      }
  };

  const handlePoseSelect = async (option: ControlOption) => {
      if (!resultImage || isBusy || !checkCredits(COST_VARIATION)) return;
      setSelectedPose(option.id);
      setStatus(ProcessingStatus.GENERATING_POSE);
      setPoseResultImage(null);
      try {
          const generatedPose = await generatePoseVariation(resultImage, option.prompt);
          deductCredits(COST_VARIATION);
          setPoseResultImage(generatedPose);
          setStatus(ProcessingStatus.SUCCESS);
      } catch (error: any) {
          setStatus(ProcessingStatus.ERROR);
          setErrorMessage(error.message);
      }
  };

  const handleHairSelect = async (option: ControlOption) => {
    if (!resultImage || isBusy || !checkCredits(COST_VARIATION)) return;
    setSelectedHair(option.id);
    setStatus(ProcessingStatus.GENERATING_HAIR);
    setHairResultImage(null);
    try {
        const generatedHair = await generateHairVariation(resultImage, option.prompt);
        deductCredits(COST_VARIATION);
        setHairResultImage(generatedHair);
        setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
        setStatus(ProcessingStatus.ERROR);
        setErrorMessage(error.message);
    }
  };

  const handleSingerVariationSelect = async (option: ControlOption) => {
      if (!flyerFinalResult || isBusy || !checkCredits(COST_VARIATION)) return;
      setSelectedSingerVar(option.id);
      setStatus(ProcessingStatus.GENERATING_SINGER_VAR);
      setSingerVariationResultImage(null);
      try {
          const generatedVar = await generateSingerVariation(flyerFinalResult, option.prompt);
          deductCredits(COST_VARIATION);
          setSingerVariationResultImage(generatedVar);
          setStatus(ProcessingStatus.SUCCESS);
      } catch (error: any) {
          setStatus(ProcessingStatus.ERROR);
          setErrorMessage(error.message);
      }
  };

  const generateCoupon = (value: number) => {
      const code = 'SWAP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const newCoupon: Coupon = { code, value, isRedeemed: false, createdAt: Date.now() };
      setCoupons(prev => [newCoupon, ...prev]);
  };

  const redeemCoupon = () => {
      const normalizedCode = redeemCode.trim().toUpperCase();
      const couponIndex = coupons.findIndex(c => c.code === normalizedCode);
      if (couponIndex === -1) { setErrorMessage("Código inválido."); return; }
      if (coupons[couponIndex].isRedeemed) { setErrorMessage("Código já usado."); return; }
      const updatedCoupons = [...coupons];
      updatedCoupons[couponIndex].isRedeemed = true;
      setCoupons(updatedCoupons);
      setCredits(prev => prev + coupons[couponIndex].value);
      setRedeemCode('');
      setErrorMessage(null);
      alert(`Sucesso! ${coupons[couponIndex].value} créditos adicionados.`);
  };

  const handleSaveFlow = () => {
    const flowData: SavedFlowState = {
      version: 5, 
      timestamp: Date.now(),
      credits,
      positions,
      images: {
        person: personImage,
        clothing: clothingImage,
        result: resultImage,
        finalResult: finalResultImage,
        poseResult: poseResultImage,
        hairResult: hairResultImage
      },
      singerFlow: {
          positions: singerPositions,
          text: eventDetails,
          textConfig: {
              fontSize: eventFontSize,
              fontColor: eventFontColor,
              fontFamily: eventFontFamily
          },
          images: {
              flyerRef: flyerRefImage,
              singer: singerImage,
              baseResult: flyerBaseResult,
              finalResult: flyerFinalResult,
              variationResult: singerVariationResultImage
          }
      },
      ui: { showExtendedFlow }
    };
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vizualz-flow-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFileInputRef = useRef<HTMLInputElement>(null);
  const handleLoadFlow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as SavedFlowState;
        if (json.positions) setPositions({ ...DEFAULT_POSITIONS, ...json.positions });
        
        // Load Studio Images
        if (json.images) {
          if (json.images.person) setPersonImage({ ...json.images.person, previewUrl: json.images.person.base64 || null });
          if (json.images.clothing) setClothingImage({ ...json.images.clothing, previewUrl: json.images.clothing.base64 || null });
          if (json.images.result) setResultImage(json.images.result);
          if (json.images.finalResult) setFinalResultImage(json.images.finalResult);
          if (json.images.poseResult) setPoseResultImage(json.images.poseResult);
          if (json.images.hairResult) setHairResultImage(json.images.hairResult);
        }
        
        // Load Singer Flow
        if (json.singerFlow) {
            if (json.singerFlow.positions) setSingerPositions({ ...DEFAULT_SINGER_POSITIONS, ...json.singerFlow.positions });
            setEventDetails(json.singerFlow.text || '');
            
            // Load Font Config
            if (json.singerFlow.textConfig) {
                setEventFontSize(json.singerFlow.textConfig.fontSize || 'Médio');
                setEventFontColor(json.singerFlow.textConfig.fontColor || '#FFFFFF');
                setEventFontFamily(json.singerFlow.textConfig.fontFamily || 'Original');
            }

            if (json.singerFlow.images) {
                if (json.singerFlow.images.flyerRef) setFlyerRefImage({ ...json.singerFlow.images.flyerRef, previewUrl: json.singerFlow.images.flyerRef.base64 || null });
                if (json.singerFlow.images.singer) setSingerImage({ ...json.singerFlow.images.singer, previewUrl: json.singerFlow.images.singer.base64 || null });
                if (json.singerFlow.images.baseResult) setFlyerBaseResult(json.singerFlow.images.baseResult);
                if (json.singerFlow.images.finalResult) setFlyerFinalResult(json.singerFlow.images.finalResult);
                if (json.singerFlow.images.variationResult) setSingerVariationResultImage(json.singerFlow.images.variationResult);
            }
        }

        if (json.ui) setShowExtendedFlow(json.ui.showExtendedFlow);
        setStatus(ProcessingStatus.IDLE);
      } catch (err) {
        setErrorMessage("Arquivo inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderNodes = () => {
    if (activeTab === 'singer') {
        return (
            <div className="relative w-[1920px] h-[1200px]">
                <ConnectionLines 
                    status={status} 
                    hasResult={false} // Unused in Singer Flow logic inside Component
                    hasFinalResult={false}
                    hasPoseResult={false}
                    hasHairResult={false}
                    showEditor={false}
                    positions={positions}
                    singerPositions={singerPositions}
                    activeTab="singer"
                    hasSingerBaseResult={!!flyerBaseResult}
                    hasSingerFinalResult={!!flyerFinalResult}
                    hasSingerVariationResult={!!singerVariationResultImage}
                />

                <NodeCard 
                    title="Flyer Referência" 
                    type="input" 
                    imageState={flyerRefImage}
                    onImageUpload={(e) => handleImageUpload(e, setFlyerRefImage)}
                    style={{ left: singerPositions.flyerRef.x, top: singerPositions.flyerRef.y }}
                    onDragStart={(e) => handleDragStart(e, 'flyerRef', singerPositions.flyerRef.x, singerPositions.flyerRef.y)}
                    onTouchStart={(e) => handleTouchStart(e, 'flyerRef', singerPositions.flyerRef.x, singerPositions.flyerRef.y)}
                    isMobile={isMobile}
                />

                <NodeCard 
                    title="Novo Cantor" 
                    type="input" 
                    imageState={singerImage}
                    onImageUpload={(e) => handleImageUpload(e, setSingerImage)}
                    style={{ left: singerPositions.singerImg.x, top: singerPositions.singerImg.y }}
                    onDragStart={(e) => handleDragStart(e, 'singerImg', singerPositions.singerImg.x, singerPositions.singerImg.y)}
                    onTouchStart={(e) => handleTouchStart(e, 'singerImg', singerPositions.singerImg.x, singerPositions.singerImg.y)}
                    isMobile={isMobile}
                />

                <NodeCard 
                    title="Troca de Cantor" 
                    type="process" 
                    isActive={status === ProcessingStatus.GENERATING_SINGER_SWAP}
                    onClick={processSingerSwap}
                    disabled={!flyerRefImage.base64 || !singerImage.base64 || isBusy}
                    style={{ left: singerPositions.processSwap.x, top: singerPositions.processSwap.y }}
                    onDragStart={(e) => handleDragStart(e, 'processSwap', singerPositions.processSwap.x, singerPositions.processSwap.y)}
                    onTouchStart={(e) => handleTouchStart(e, 'processSwap', singerPositions.processSwap.x, singerPositions.processSwap.y)}
                    isMobile={isMobile}
                />
                 <div className="absolute text-[10px] text-slate-400 font-mono pointer-events-none" style={{ left: singerPositions.processSwap.x + (isMobile ? 50 : 80), top: singerPositions.processSwap.y + (isMobile ? 150 : 160) }}>Custo: {COST_BASE_SWAP}</div>

                 <NodeCard 
                    title="Flyer (Base)" 
                    type="output" 
                    resultImage={flyerBaseResult}
                    style={{ left: singerPositions.baseResult.x, top: singerPositions.baseResult.y }}
                    onDragStart={(e) => handleDragStart(e, 'baseResult', singerPositions.baseResult.x, singerPositions.baseResult.y)}
                    onTouchStart={(e) => handleTouchStart(e, 'baseResult', singerPositions.baseResult.x, singerPositions.baseResult.y)}
                    isMobile={isMobile}
                    onPreview={flyerBaseResult ? () => setPreviewImage(flyerBaseResult) : undefined}
                />
                
                {flyerBaseResult && (
                    <>
                        <NodeCard 
                            title="Dados do Evento" 
                            type="text-input"
                            textValue={eventDetails}
                            onTextChange={(e) => setEventDetails(e.target.value)}
                            textConfig={{
                                fontSize: eventFontSize,
                                onFontSizeChange: setEventFontSize,
                                fontColor: eventFontColor,
                                onFontColorChange: setEventFontColor,
                                fontFamily: eventFontFamily,
                                onFontFamilyChange: setEventFontFamily
                            }}
                            style={{ left: singerPositions.eventData.x, top: singerPositions.eventData.y }}
                            onDragStart={(e) => handleDragStart(e, 'eventData', singerPositions.eventData.x, singerPositions.eventData.y)}
                            onTouchStart={(e) => handleTouchStart(e, 'eventData', singerPositions.eventData.x, singerPositions.eventData.y)}
                            isMobile={isMobile}
                        />
                        <NodeCard 
                            title="Aplicar Texto" 
                            type="process" 
                            isActive={status === ProcessingStatus.GENERATING_FLYER_TEXT}
                            onClick={processFlyerText}
                            disabled={!eventDetails || isBusy}
                            style={{ left: singerPositions.processText.x, top: singerPositions.processText.y }}
                            onDragStart={(e) => handleDragStart(e, 'processText', singerPositions.processText.x, singerPositions.processText.y)}
                            onTouchStart={(e) => handleTouchStart(e, 'processText', singerPositions.processText.x, singerPositions.processText.y)}
                            isMobile={isMobile}
                        />
                        <div className="absolute text-[10px] text-slate-400 font-mono pointer-events-none" style={{ left: singerPositions.processText.x + (isMobile ? 50 : 80), top: singerPositions.processText.y + (isMobile ? 150 : 160) }}>Custo: {COST_TEXT_EDIT}</div>
                    </>
                )}

                <NodeCard 
                    title="Flyer Final" 
                    type="output" 
                    resultImage={flyerFinalResult}
                    style={{ left: singerPositions.finalOutput.x, top: singerPositions.finalOutput.y }}
                    onDragStart={(e) => handleDragStart(e, 'finalOutput', singerPositions.finalOutput.x, singerPositions.finalOutput.y)}
                    onTouchStart={(e) => handleTouchStart(e, 'finalOutput', singerPositions.finalOutput.x, singerPositions.finalOutput.y)}
                    isMobile={isMobile}
                    onPreview={flyerFinalResult ? () => setPreviewImage(flyerFinalResult) : undefined}
                />

                {flyerFinalResult && (
                    <>
                         <NodeCard 
                            title="Variação de Cantor" 
                            type="control" 
                            options={SINGER_VARIATION_OPTIONS} 
                            onOptionSelect={handleSingerVariationSelect} 
                            selectedOptionId={selectedSingerVar}
                            style={{ left: singerPositions.singerVariationControl!.x, top: singerPositions.singerVariationControl!.y }} 
                            onDragStart={(e) => handleDragStart(e, 'singerVariationControl', singerPositions.singerVariationControl!.x, singerPositions.singerVariationControl!.y)} 
                            onTouchStart={(e) => handleTouchStart(e, 'singerVariationControl', singerPositions.singerVariationControl!.x, singerPositions.singerVariationControl!.y)} 
                            isMobile={isMobile} 
                        />
                         <NodeCard 
                            title="Flyer Alternativo" 
                            type="output" 
                            resultImage={singerVariationResultImage}
                            isActive={status === ProcessingStatus.GENERATING_SINGER_VAR}
                            style={{ left: singerPositions.singerVariationOutput!.x, top: singerPositions.singerVariationOutput!.y }} 
                            onDragStart={(e) => handleDragStart(e, 'singerVariationOutput', singerPositions.singerVariationOutput!.x, singerPositions.singerVariationOutput!.y)} 
                            onTouchStart={(e) => handleTouchStart(e, 'singerVariationOutput', singerPositions.singerVariationOutput!.x, singerPositions.singerVariationOutput!.y)} 
                            isMobile={isMobile}
                            onPreview={singerVariationResultImage ? () => setPreviewImage(singerVariationResultImage) : undefined}
                        />
                    </>
                )}
            </div>
        )
    }

    // Default Flow (Studio)
    return (
        <div className="relative w-[1920px] h-[1200px]">
            <ConnectionLines 
                status={status} 
                hasResult={!!resultImage} 
                hasFinalResult={!!finalResultImage}
                hasPoseResult={!!poseResultImage}
                hasHairResult={!!hairResultImage}
                showEditor={showExtendedFlow}
                positions={positions}
            />
            <NodeCard title="Sua Foto" type="input" imageState={personImage} onImageUpload={(e) => handleImageUpload(e, setPersonImage)} style={{ left: positions.person.x, top: positions.person.y }} onDragStart={(e) => handleDragStart(e, 'person', positions.person.x, positions.person.y)} onTouchStart={(e) => handleTouchStart(e, 'person', positions.person.x, positions.person.y)} isMobile={isMobile} />
            <NodeCard title="Roupa Nova" type="input" imageState={clothingImage} onImageUpload={(e) => handleImageUpload(e, setClothingImage)} style={{ left: positions.clothing.x, top: positions.clothing.y }} onDragStart={(e) => handleDragStart(e, 'clothing', positions.clothing.x, positions.clothing.y)} onTouchStart={(e) => handleTouchStart(e, 'clothing', positions.clothing.x, positions.clothing.y)} isMobile={isMobile} />
            
            <NodeCard title="Motor IA" type="process" isActive={status === ProcessingStatus.PROCESSING} onClick={processSwap} disabled={!personImage.base64 || !clothingImage.base64 || isBusy} style={{ left: positions.process.x, top: positions.process.y }} onDragStart={(e) => handleDragStart(e, 'process', positions.process.x, positions.process.y)} onTouchStart={(e) => handleTouchStart(e, 'process', positions.process.x, positions.process.y)} isMobile={isMobile} />
            <div className="absolute text-[10px] text-slate-400 font-mono pointer-events-none" style={{ left: positions.process.x + (isMobile ? 50 : 80), top: positions.process.y + (isMobile ? 150 : 160) }}>Custo: {COST_BASE_SWAP} créditos</div>
            
            <NodeCard title="Resultado Base" type="output" resultImage={resultImage} style={{ left: positions.output.x, top: positions.output.y }} onDragStart={(e) => handleDragStart(e, 'output', positions.output.x, positions.output.y)} onTouchStart={(e) => handleTouchStart(e, 'output', positions.output.x, positions.output.y)} isMobile={isMobile} onPreview={resultImage ? () => setPreviewImage(resultImage) : undefined} />
            
            {showExtendedFlow && (
                <>
                    <NodeCard title="Editor de Estilo" type="control" options={STYLE_OPTIONS} onOptionSelect={handleStyleSelect} selectedOptionId={selectedControl} style={{ left: positions.editor.x, top: positions.editor.y }} onDragStart={(e) => handleDragStart(e, 'editor', positions.editor.x, positions.editor.y)} onTouchStart={(e) => handleTouchStart(e, 'editor', positions.editor.x, positions.editor.y)} isMobile={isMobile} />
                    <NodeCard title="Look Final" type="output" resultImage={finalResultImage} isActive={status === ProcessingStatus.REFINING} style={{ left: positions.final.x, top: positions.final.y }} onDragStart={(e) => handleDragStart(e, 'final', positions.final.x, positions.final.y)} onTouchStart={(e) => handleTouchStart(e, 'final', positions.final.x, positions.final.y)} isMobile={isMobile} onPreview={finalResultImage ? () => setPreviewImage(finalResultImage) : undefined} />
                    <NodeCard title="Gerar Poses" type="control" options={POSE_OPTIONS} onOptionSelect={handlePoseSelect} selectedOptionId={selectedPose} style={{ left: positions.poseControl.x, top: positions.poseControl.y }} onDragStart={(e) => handleDragStart(e, 'poseControl', positions.poseControl.x, positions.poseControl.y)} onTouchStart={(e) => handleTouchStart(e, 'poseControl', positions.poseControl.x, positions.poseControl.y)} isMobile={isMobile} />
                    <NodeCard title="Variação de Pose" type="output" resultImage={poseResultImage} isActive={status === ProcessingStatus.GENERATING_POSE} style={{ left: positions.poseOutput.x, top: positions.poseOutput.y }} onDragStart={(e) => handleDragStart(e, 'poseOutput', positions.poseOutput.x, positions.poseOutput.y)} onTouchStart={(e) => handleTouchStart(e, 'poseOutput', positions.poseOutput.x, positions.poseOutput.y)} isMobile={isMobile} onPreview={poseResultImage ? () => setPreviewImage(poseResultImage) : undefined} />
                    <NodeCard title="Corte de Cabelo" type="control" options={HAIR_OPTIONS} onOptionSelect={handleHairSelect} selectedOptionId={selectedHair} style={{ left: positions.hairControl.x, top: positions.hairControl.y }} onDragStart={(e) => handleDragStart(e, 'hairControl', positions.hairControl.x, positions.hairControl.y)} onTouchStart={(e) => handleTouchStart(e, 'hairControl', positions.hairControl.x, positions.hairControl.y)} isMobile={isMobile} />
                    <NodeCard title="Variação de Cabelo" type="output" resultImage={hairResultImage} isActive={status === ProcessingStatus.GENERATING_HAIR} style={{ left: positions.hairOutput.x, top: positions.hairOutput.y }} onDragStart={(e) => handleDragStart(e, 'hairOutput', positions.hairOutput.x, positions.hairOutput.y)} onTouchStart={(e) => handleTouchStart(e, 'hairOutput', positions.hairOutput.x, positions.hairOutput.y)} isMobile={isMobile} onPreview={hairResultImage ? () => setPreviewImage(hairResultImage) : undefined} />
                </>
            )}
        </div>
    );
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      <header className="p-3 md:p-4 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-wrap justify-between items-center px-4 md:px-8 shadow-lg gap-2 md:gap-4 shrink-0">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
            <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">VIZUALZ</h1>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setActiveTab('flow')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${activeTab === 'flow' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Estúdio</button>
                <button onClick={() => setActiveTab('singer')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${activeTab === 'singer' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Cantor</button>
                <button onClick={() => setActiveTab('credits')} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${activeTab === 'credits' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Carteira</button>
            </div>
             <div className="md:hidden flex items-center gap-2"><img src={user?.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-600" /></div>
        </div>
        <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-yellow-500/30">
                <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-slate-900 font-bold">$</div>
                <span className="text-yellow-400 font-bold text-sm">{credits}</span>
             </div>
             <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <input type="file" ref={loadFileInputRef} onChange={handleLoadFlow} accept=".json" className="hidden" />
            <button onClick={() => loadFileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0L8 8m4-4v12" /></svg>Carregar</button>
            <button onClick={handleSaveFlow} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Salvar</button>
            <button onClick={() => { if(confirm("Tem certeza que deseja resetar o layout?")) { setPositions(DEFAULT_POSITIONS); if (user) localStorage.removeItem(getStorageKeys(user.id).pos); } }} className="text-[10px] text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-900/50 px-2 py-1.5 rounded transition-colors">Reset</button>
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-3"><img src={user?.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-600" /></div>
        </div>
        <div className="flex md:hidden w-full justify-between items-center mt-2 border-t border-slate-800 pt-2">
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-yellow-500/30">
                <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-slate-900 font-bold">$</div>
                <span className="text-yellow-400 font-bold text-sm">{credits}</span>
             </div>
             <div className="flex gap-2"><button onClick={handleSaveFlow} className="p-2 bg-blue-600 rounded-lg text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg></button></div>
        </div>
      </header>

      {activeTab === 'credits' ? (
          <main className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto">
              <div className={`max-w-4xl mx-auto grid grid-cols-1 ${isAdminVisible ? 'md:grid-cols-2' : ''} gap-8 transition-all duration-300`}>
                  <div className={`space-y-6 ${!isAdminVisible ? 'max-w-md mx-auto w-full' : ''}`}>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10"><svg className="w-32 h-32 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg></div>
                          <h2 className="text-xl font-bold text-slate-300 mb-2">Seu Saldo</h2>
                          <div className="text-5xl font-extrabold text-white mb-1 flex items-center gap-2"><span className="text-yellow-400">$</span> {credits}</div>
                          <p className="text-slate-500 text-sm">Créditos de Geração Disponíveis</p>
                          <div className="mt-8 border-t border-slate-800 pt-6">
                              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Resgatar Código</label>
                              <div className="flex gap-2">
                                  <input type="text" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="SWAP-XXXXXXXX" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono" />
                                  <button onClick={redeemCoupon} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition-colors">Resgatar</button>
                              </div>
                          </div>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                          <h3 className="font-bold text-white mb-4">Tabela de Custos</h3>
                          <ul className="space-y-3">
                              <li className="flex justify-between text-sm"><span className="text-slate-400">Troca de Roupa (Base)</span><span className="text-yellow-400 font-mono font-bold">-{COST_BASE_SWAP} Créditos</span></li>
                              <li className="flex justify-between text-sm"><span className="text-slate-400">Flyer de Cantor</span><span className="text-yellow-400 font-mono font-bold">-{COST_BASE_SWAP} Créditos</span></li>
                              <li className="flex justify-between text-sm"><span className="text-slate-400">Editar Agenda</span><span className="text-yellow-400 font-mono font-bold">-{COST_TEXT_EDIT} Créditos</span></li>
                              <li className="flex justify-between text-sm"><span className="text-slate-400">Variações (Estilo/Pose/Cabelo)</span><span className="text-yellow-400 font-mono font-bold">-{COST_VARIATION} Crédito</span></li>
                          </ul>
                      </div>
                  </div>
                  {isAdminVisible && (
                      <div className="bg-slate-900 border border-purple-900/30 rounded-2xl p-6 shadow-xl">
                          <h2 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>Painel Admin</h2>
                          <div className="space-y-4 mb-8">
                              <p className="text-xs text-slate-500 uppercase font-bold">Gerar Novos Códigos</p>
                              <div className="grid grid-cols-3 gap-3">
                                  <button onClick={() => generateCoupon(5)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">+5 Créditos</button>
                                  <button onClick={() => generateCoupon(10)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">+10 Créditos</button>
                                  <button onClick={() => generateCoupon(50)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-2 rounded-lg text-sm font-bold transition-colors">+50 Créditos</button>
                              </div>
                          </div>
                          <div>
                              <p className="text-xs text-slate-500 uppercase font-bold mb-3">Códigos Gerados</p>
                              <div className="bg-slate-950 rounded-xl border border-slate-800 max-h-80 overflow-y-auto custom-scrollbar p-2">
                                  {coupons.length === 0 ? (<p className="text-slate-600 text-center py-4 text-sm">Nenhum código gerado.</p>) : (
                                      <div className="space-y-2">{coupons.map((coupon) => (
                                          <div key={coupon.code} onClick={() => { navigator.clipboard.writeText(coupon.code); alert(`Código ${coupon.code} copiado!`); }} className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer transition-all hover:bg-slate-900 ${coupon.isRedeemed ? 'border-red-900/30 bg-red-900/10 opacity-50' : 'border-emerald-900/30 bg-emerald-900/10'}`}>
                                              <div className="flex flex-col"><span className={`font-mono font-bold ${coupon.isRedeemed ? 'text-red-400 line-through' : 'text-emerald-400'}`}>{coupon.code}</span><span className="text-[10px] text-slate-500">{new Date(coupon.createdAt).toLocaleDateString()}</span></div>
                                              <div className="flex items-center gap-2"><span className="text-white font-bold text-sm">{coupon.value} $</span>{coupon.isRedeemed && <span className="text-[10px] text-red-500 font-bold uppercase">Usado</span>}</div>
                                          </div>
                                      ))}</div>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </main>
      ) : (
          <main ref={containerRef} className="flex-1 relative w-full overflow-auto cursor-crosshair bg-slate-950" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none w-[1920px] h-[1200px]" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                {renderNodes()}
          </main>
      )}

      {previewImage && (<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}><button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white hover:text-red-400 transition-colors z-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button><img src={previewImage} alt="Preview Fullscreen" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} /></div>)}

      {errorMessage && (<div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl backdrop-blur-sm animate-bounce z-50 cursor-pointer w-11/12 md:w-auto text-center" onClick={() => setErrorMessage(null)}><div className="flex items-center gap-2 justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg><p className="font-bold text-sm">{errorMessage}</p></div></div>)}
    </div>
  );
};

export default App;
