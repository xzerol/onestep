export function buildSellingPointsPrompt(input: {
  productName?: string | null;
  productInput: string;
  sourceImageUrl?: string | null;
}) {
  return JSON.stringify({
    role: "你是一名亚马逊电商视觉策划",
    task: "根据产品信息，生成 5 条电商卖点文案。每条卖点必须深入贴合产品描述，提炼出真实的使用场景、目标人群、使用方法和核心优势，避免泛泛而谈。",
    requirements: {
      format: "输出 JSON，不要输出 markdown",
      fields: {
        order: "整数，1 到 5",
        headline: "10字以内，短、强、明确",
        body: "120字以内，必须结合产品描述写出具体场景（何时何地）、人物（谁在用、怎么用）和使用方法，突出真实利益，不要空话套话",
        imagePrompt: "适合图片模型生成的英文视觉提示词，需把场景、人物和使用方法转化为具体画面描述",
      },
      content_rules: [
        "每条卖点必须基于输入的产品描述提炼，禁止编造产品没有的功能或参数",
        "必须包含具体使用场景（如居家、户外、办公、旅行、运动等）",
        "必须描述目标用户或人物互动（如妈妈单手操作、上班族通勤佩戴、孩子独立使用、情侣共同准备等）",
        "必须体现使用方法或产品如何解决问题（如一键开合、三秒安装、随身携带、睡前涂抹等）",
        "5 条卖点之间要有明显差异，覆盖不同角度（功能、场景、人群、情感、细节）",
      ],
      imagePrompt_rules: [
        "分辨率：正方形构图，强制输出 2048x2048 高分辨率（output resolution must be 2048x2048 square）",
        "严禁中文：画面中绝对禁止出现任何中文字符、汉字或中文标语（strictly no Chinese characters, no Chinese text, no Chinese slogans）",
        "多角度：特写、平视、45°俯视或手持动态角度（varied camera angles: close-up, eye-level, 45° top-down, or handheld dynamic shot）",
        "人物互动：当卖点适合时，加入真实生活场景中的人手使用、佩戴或与产品互动的画面（human interaction or hands using the product in a lifestyle context）",
        "场景感：室内/户外真实环境，避免纯纯色背景（authentic real-world setting）",
        "光影质感：premium commercial lighting",
        "干净无水印：no watermark, no extra text",
      ],
      fallback_rule: "如果输入信息不足，不要编造具体参数，改写为相对保守的表达",
      count: "必须严格返回 5 条数据，order 依次为 1 到 5",
    },
    input: {
      productName: input.productName ?? "",
      productInput: input.productInput,
      sourceImageUrl: input.sourceImageUrl ?? "",
    },
  });
}

export function buildImagePrompt(input: {
  headline: string;
  body: string;
  imagePrompt?: string | null;
}) {
  return JSON.stringify({
    task: "Create a premium Amazon selling-point image",
    main_claim: input.headline,
    support_copy_intent: input.body,
    visual_brief: input.imagePrompt ?? "",
    resolution: "2048x2048 square format",
    visual_requirements: [
      "output resolution must be 2048x2048 square",
      "strictly no Chinese characters, no Chinese text, no Chinese slogans anywhere on the image",
      "dynamic product placement with varied angles (close-up, eye-level, or 45° top-down)",
      "authentic lifestyle context with human interaction or hands using the product when relevant",
      "contextual background (real-world indoor or outdoor scene) or soft gradient if the brief calls for it",
      "premium commercial lighting",
      "high clarity",
      "no watermark",
      "no branding",
      "no extra objects unless relevant",
      "no text rendered inside image",
    ],
    style: [
      "modern product advertising",
      "realistic materials",
      "sharp edges",
      "professional studio quality",
    ],
  });
}
