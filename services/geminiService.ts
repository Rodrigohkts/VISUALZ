

import { GoogleGenAI } from "@google/genai";

// Helper to remove the data URL prefix for the API
const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64: string): string => {
    const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
    return match ? match[1] : 'image/jpeg';
}

const MODEL_ID = 'gemini-2.5-flash-image';

export const generateOutfitSwap = async (
  personImageBase64: string,
  clothingImageBase64: string,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });

    const personMime = getMimeType(personImageBase64);
    const clothingMime = getMimeType(clothingImageBase64);

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: {
        parts: [
          {
            text: `Atue como um especialista em COMPOSIÇÃO DE IMAGEM e RETOQUE DE MODA (Virtual Try-On).
Sua missão é vestir a pessoa da Imagem 1 com a roupa exata da Imagem 2.

REGRAS DE OURO (FIDELIDADE MÁXIMA AO PRODUTO):
1. CLONAGEM TÊXTIL: A roupa da Imagem 2 (Roupa Nova) deve ser transferida para o corpo da pessoa. Você PROIBIDO de alterar a estampa, a cor, a textura ou o design da roupa nova. Ela deve parecer IDÊNTICA à foto do produto enviada.
2. ADAPTAÇÃO FÍSICA (WARPING): Ajuste a roupa nova apenas geometricamente para envolver o corpo da pessoa e respeitar a pose. Imagine que você está deformando o tecido real sobre o corpo, não desenhando uma roupa nova.
3. ILUMINAÇÃO: Aplique as sombras e luzes da cena da Imagem 1 sobre a roupa, mas sem alterar a cor base do tecido.
4. REMOÇÃO: Remova completamente a roupa antiga. Não deixe nada da roupa original aparecer (golas antigas, mangas antigas).
5. RECONSTRUÇÃO: Se a roupa nova for mais curta ou decotada, reconstrua a pele da pessoa de forma realista e anatomicamente correta.

Resumo: Mantenha a pessoa. Mantenha a roupa nova exata. Apenas junte as duas imagens com realismo fotográfico.`
          },
          {
            inlineData: {
              mimeType: personMime,
              data: cleanBase64(personImageBase64),
            },
          },
          {
            inlineData: {
              mimeType: clothingMime,
              data: cleanBase64(clothingImageBase64),
            },
          },
        ],
      },
    });

    // Parse response for image
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("A IA não retornou uma imagem válida.");

  } catch (error: any) {
    handleGeminiError(error);
    throw error; // Re-throw para o componente tratar se necessário
  }
};

export const refineImage = async (
  baseImageBase64: string,
  instruction: string,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    const mimeType = getMimeType(baseImageBase64);

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: {
        parts: [
          {
            text: `Atue como um editor de fotografia de moda high-end. Siga estritamente esta instrução de edição: "${instruction}".\n\nREGRAS DE OURO:\n1. IMUTÁVEL: A pessoa, seu rosto, corpo, pose e, PRINCIPALMENTE, a roupa que ela está vestindo DEVEM PERMANECER IDÊNTICOS. Não mude a cor nem o corte da roupa.\n2. ALTERAÇÃO: Mude apenas o que foi pedido (fundo, luz ou filtro).\n3. REALISMO: Se mudar o fundo, ajuste sutilmente a iluminação nas bordas do sujeito para integrar com o novo ambiente, mas sem alterar a roupa.`
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64(baseImageBase64),
            },
          },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Falha ao gerar a edição.");
  } catch (error: any) {
    handleGeminiError(error);
    throw error;
  }
};

export const generatePoseVariation = async (
    baseImageBase64: string,
    poseDescription: string,
    apiKey?: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
        const mimeType = getMimeType(baseImageBase64);

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: {
                parts: [
                    {
                        text: `Atue como um diretor criativo de moda. Sua tarefa é gerar uma VARIAÇÃO DE POSE da pessoa na imagem.\n\nINSTRUÇÕES:\n1. IDENTIDADE: Mantenha a mesma pessoa, rosto e características físicas.\n2. ROUPA: Mantenha EXATAMENTE a mesma roupa que ela está vestindo agora.\n3. AÇÃO: Gere uma nova imagem onde esta pessoa esteja na seguinte pose: "${poseDescription}".\n4. COERÊNCIA: A iluminação e o estilo fotográfico devem permanecer consistentes com a imagem original.\n\nRetorne apenas a imagem gerada.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(baseImageBase64),
                        },
                    },
                ],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar a variação de pose.");

    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

export const generateHairVariation = async (
    baseImageBase64: string,
    hairDescription: string,
    apiKey?: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
        const mimeType = getMimeType(baseImageBase64);

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: {
                parts: [
                    {
                        text: `Atue como um cabeleireiro profissional e editor de imagem. Sua tarefa é alterar o CORTE DE CABELO da pessoa na imagem.\n\nINSTRUÇÕES:\n1. IDENTIDADE: Mantenha rigorosamente o rosto e as características faciais da pessoa.\n2. ROUPA: Mantenha EXATAMENTE a mesma roupa e a mesma pose.\n3. CABELO: Substitua o cabelo atual pelo seguinte estilo: "${hairDescription}". O cabelo deve parecer natural, com textura realista e integrado à iluminação da cena.\n\nRetorne apenas a imagem gerada.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(baseImageBase64),
                        },
                    },
                ],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar o corte de cabelo.");

    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

// STEP 1: Swap the Singer Only
export const generateSingerSwap = async (
    flyerRefBase64: string,
    singerBase64: string,
    apiKey?: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
        const flyerMime = getMimeType(flyerRefBase64);
        const singerMime = getMimeType(singerBase64);

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: {
                parts: [
                    {
                        text: `VOCÊ É UM EXPERT EM PHOTOSHOP E COMPOSIÇÃO DE IMAGEM.
                        
OBJETIVO: SUBSTITUIÇÃO TOTAL DO CANTOR NO FLYER.

ENTRADAS:
- IMAGEM 1 (FLYER): O cartaz original.
- IMAGEM 2 (NOVO CANTOR): A pessoa que DEVE estar no cartaz.

INSTRUÇÕES RIGOROSAS (PASSO A PASSO):
1. **APAGAR**: Identifique o cantor original na Imagem 1. REMOVA-O COMPLETAMENTE. Imagine que você deletou a camada dele.
2. **LIMPAR**: Preencha o espaço onde ele estava com o fundo do flyer (fumaça, luzes, palco). Não deixe "fantasmas" do cantor antigo.
3. **INSERIR**: Recorte o Novo Cantor da Imagem 2 e coloque-o EM DESTAQUE no centro, onde estava o antigo.
4. **ESCALA**: O Novo Cantor deve ser GRANDE, ocupando o mesmo espaço visual e imponência do anterior.
5. **INTEGRAÇÃO**: Aplique a mesma iluminação, cor e filtros (glow, noise, contraste) do flyer no novo cantor para que ele pareça pertencer à imagem.

IMPORTANTE: O cantor antigo NÃO PODE aparecer. O novo cantor NÃO PODE ser translúcido.

Retorne o flyer finalizado.`
                    },
                    {
                        inlineData: {
                            mimeType: flyerMime,
                            data: cleanBase64(flyerRefBase64),
                        },
                    },
                    {
                        inlineData: {
                            mimeType: singerMime,
                            data: cleanBase64(singerBase64),
                        },
                    },
                ],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao trocar o cantor.");
    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

// STEP 2: Apply Text to the Flyer (UPDATED FOR INTELLIGENT LAYOUT & FORENSIC FONT MATCHING)
export const applyFlyerText = async (
    flyerBase64: string,
    eventDetails: string,
    fontSize: string,
    fontColor: string,
    fontFamily: string,
    apiKey?: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
        const flyerMime = getMimeType(flyerBase64);

        // Enhance the user's color selection with instructions to maintain contrast
        const colorInstruction = fontColor 
            ? `Cor Base: ${fontColor}. IMPORTANTE: Se o fundo for da mesma cor ou muito próximo, adicione AUTOMATICAMENTE um Glow Externo ou Sombra Projetada para garantir contraste.` 
            : 'Cor: Use a paleta original do flyer.';

        const familyInstruction = fontFamily === 'Original'
            ? `MODO CLONAGEM (CRÍTICO): Analise os pixels dos textos existentes no flyer (datas, locais). Copie EXATAMENTE a fonte, o peso (bold/black), o estilo (itálico/reto) e os efeitos (brilho/neon/3D). O novo texto deve ser INDISTINGUÍVEL do original.`
            : `Use a família de fonte: ${fontFamily}. Mantenha os efeitos visuais (glow/sombra) do design original.`;

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: {
                parts: [
                    {
                        text: `Atue como um Designer Gráfico Sênior especialista em Tipografia e Layout de Eventos.
TAREFA: Diagramar a agenda de shows no flyer de forma INTELIGENTE e ESTETICAMENTE INTEGRADA.

1. ANÁLISE FORENSE DE TIPOGRAFIA:
   - ${familyInstruction}
   - Tamanho solicitado: ${fontSize}.
   - ${colorInstruction}

2. ALGORITMO DE POSICIONAMENTO INTELIGENTE (ADAPTATIVE LAYOUT):
   - **PASSO A**: Detecte a silhueta do Cantor. O texto NUNCA deve cobrir o rosto ou o peito do cantor.
   - **PASSO B**: Detecte o "Espaço Negativo" (áreas de fundo vazio, céu, fumaça ou chão).
   - **PASSO C**: Mova o bloco de texto para o maior espaço negativo disponível (Lateral Esquerda, Lateral Direita ou Rodapé).
   - **PASSO D**: Se o cantor estiver muito grande e sobrar pouco espaço, reduza levemente a fonte para caber no espaço disponível sem poluir.

3. ESTILO DE LISTA:
   - Formate os dados abaixo em uma lista vertical limpa e alinhada.
   - Use hierarquia visual: Destaque as DATAS (maiores) e mantenha os LOCAIS/HORAS (menores).

DADOS DA AGENDA PARA INSERIR:
${eventDetails}

Retorne apenas o flyer finalizado com o texto aplicado.`
                    },
                    {
                        inlineData: {
                            mimeType: flyerMime,
                            data: cleanBase64(flyerBase64),
                        },
                    },
                ],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao aplicar o texto.");
    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

export const generateSingerVariation = async (
    flyerBase64: string,
    variationPrompt: string,
    apiKey?: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
        const mimeType = getMimeType(flyerBase64);

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: {
                parts: [
                    {
                        text: `Atue como um designer gráfico. Sua tarefa é SUBSTITUIR o cantor principal deste flyer por um NOVO personagem: "${variationPrompt}".

REGRAS DE OURO PARA PRESERVAÇÃO:
1. **PROTEJA O TEXTO**: O flyer JÁ CONTÉM a agenda de shows escrita. Você NÃO DEVE TOCAR, BORRAR OU COBRIR O TEXTO.
2. **POSICIONAMENTO INTELIGENTE**: Gere o novo cantor de forma que ele se integre ao design (atrás dos textos se necessário, ou ao lado). O novo cantor NÃO pode bloquear a leitura das datas e locais.
3. PROTEJA O FUNDO: Mantenha o design gráfico de fundo inalterado.
4. ESTILO: Mantenha a mesma iluminação dramática e qualidade fotográfica.

Retorne apenas o flyer com o novo cantor.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64(flyerBase64),
                        },
                    },
                ],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Falha ao gerar a variação de cantor.");

    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

// --- Error Handler ---

const handleGeminiError = (error: any) => {
    console.error("Gemini API Error:", error);
    
    // Check for 429 Resource Exhausted (Quota limit)
    if (error.message && (error.message.includes('429') || error.message.includes('Resource has been exhausted') || error.message.includes('quota'))) {
        throw new Error("⚠️ COTA DA API EXCEDIDA.\n\nA chave gratuita atingiu o limite. Vá em 'Carteira' e insira sua própria API Key para continuar.");
    }

    if (error.message && error.message.includes('API_KEY')) {
         throw new Error("⚠️ API KEY INVÁLIDA.\n\nVerifique se configurou sua chave corretamente na aba 'Carteira'.");
    }

    throw new Error("Ocorreu um erro ao processar a imagem. Tente novamente.");
};
