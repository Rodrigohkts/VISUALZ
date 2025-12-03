
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
  clothingImageBase64: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const personMime = getMimeType(personImageBase64);
    const clothingMime = getMimeType(clothingImageBase64);

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: {
        parts: [
          {
            text: "Atue como um especialista sênior em retoque digital e IA de moda (Virtual Try-On). Sua tarefa é realizar uma SUBSTITUIÇÃO TOTAL de vestuário.\n\nINSTRUÇÕES RIGOROSAS:\n1. APAGUE COMPLETAMENTE a roupa que a pessoa está vestindo na primeira imagem. Ignore a textura, cor e estampa da roupa antiga.\n2. VISTA a pessoa com a roupa fornecida na segunda imagem. A nova roupa deve ser opaca e cobrir totalmente a área do corpo correspondente.\n3. PROIBIDO: Não faça fusão (blending) entre a roupa antiga e a nova. Não deixe a roupa antiga 'vazar' ou aparecer por baixo. O resultado deve parecer que a pessoa vestiu apenas a nova peça.\n4. RECONSTRUÇÃO DE PELE: Se a nova roupa for mais curta, decotada ou sem mangas em comparação com a original, você DEVE reconstruir a pele visível (inpainting) com textura e tom de pele realistas e anatomicamente corretos.\n5. PRESERVE RIGOROSAMENTE: O rosto (identidade), cabelo, mãos, acessórios (relógios, anéis), pose exata e todo o cenário de fundo. A iluminação na nova roupa deve corresponder à iluminação da cena.\n\nGere apenas a imagem final realista em alta qualidade."
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

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const refineImage = async (
  baseImageBase64: string,
  instruction: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    throw error;
  }
};

export const generatePoseVariation = async (
    baseImageBase64: string,
    poseDescription: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    } catch (error) {
        console.error("Gemini Pose Error:", error);
        throw error;
    }
};

export const generateHairVariation = async (
    baseImageBase64: string,
    hairDescription: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    } catch (error) {
        console.error("Gemini Hair Error:", error);
        throw error;
    }
};

// STEP 1: Swap the Singer Only
export const generateSingerSwap = async (
    flyerRefBase64: string,
    singerBase64: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    } catch (error) {
        console.error("Gemini Singer Swap Error:", error);
        throw error;
    }
};

// STEP 2: Apply Text to the Flyer (UPDATED FOR INTELLIGENT LAYOUT & FORENSIC FONT MATCHING)
export const applyFlyerText = async (
    flyerBase64: string,
    eventDetails: string,
    fontSize: string,
    fontColor: string,
    fontFamily: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    } catch (error) {
        console.error("Gemini Text Apply Error:", error);
        throw error;
    }
};

export const generateSingerVariation = async (
    flyerBase64: string,
    variationPrompt: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    } catch (error) {
        console.error("Gemini Singer Variation Error:", error);
        throw error;
    }
};
