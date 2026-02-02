import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
if (!process.env.OPENAI_API_KEY) {
  console.error("¡ATENCIÓN! La variable de entorno OPENAI_API_KEY no está configurada.");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

// Generate social media content based on business info
export async function generateSocialMediaContent(
  prompt: string,
  platform: string,
  language: string
): Promise<{ content: string, hashtags: string[] | string }> {
  try {
    console.log(`Generando contenido para ${platform} en ${language}`);
    
    // Verificar API key antes de hacer la solicitud
    if (!process.env.OPENAI_API_KEY) {
      console.error("No se puede generar contenido sin OPENAI_API_KEY");
      throw new Error("OpenAI API key is not configured");
    }
    
    const systemPrompt = `You are an expert social media content creator. 
    Create engaging, professional content for ${platform} in ${language} language.
    Consider platform-specific best practices and character limits.
    Return your response as JSON with 'content' and 'hashtags' fields.`;

    console.log("Enviando solicitud a OpenAI");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    console.log("Respuesta recibida de OpenAI");

    // Parse the JSON response
    const responseText = response.choices[0].message.content;
    console.log("Texto de respuesta:", responseText);
    
    if (!responseText) {
      throw new Error("Received empty response from OpenAI");
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log("Respuesta analizada correctamente:", result);
      
      return {
        content: result.content || "",
        hashtags: result.hashtags || []
      };
    } catch (parseError) {
      console.error("Error al analizar la respuesta JSON:", parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Error completo de OpenAI:", error);
    if (error.response) {
      console.error("Detalles de la respuesta de error:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    throw new Error(`Failed to generate social media content: ${error.message}`);
  }
}

// Generate content for multiple platforms at once
export async function generateMultiPlatformContent(
  prompt: string,
  platforms: string[],
  language: string
): Promise<Record<string, { content: string, hashtags: string[] | string }>> {
  try {
    console.log(`Generando contenido multi-plataforma para: ${platforms.join(", ")} en ${language}`);
    
    // Verificar API key antes de hacer la solicitud
    if (!process.env.OPENAI_API_KEY) {
      console.error("No se puede generar contenido multi-plataforma sin OPENAI_API_KEY");
      throw new Error("OpenAI API key is not configured");
    }
    
    const systemPrompt = `You are an expert social media content creator.
    Create engaging, professional content for multiple platforms in ${language} language.
    Consider each platform's best practices, character limits, and format requirements.
    Return your response as JSON with each platform as a key, and 'content' and 'hashtags' fields for each platform.`;

    const userPrompt = `Create content for the following platforms: ${platforms.join(", ")}.
    
    Business information: ${prompt}
    
    Format your response as JSON like this:
    {
      "platform1": {
        "content": "The content for platform1",
        "hashtags": ["hashtag1", "hashtag2"]
      },
      "platform2": {
        "content": "The content for platform2",
        "hashtags": ["hashtag1", "hashtag2"]
      }
    }`;

    console.log("Enviando solicitud multi-plataforma a OpenAI");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" }
    });
    console.log("Respuesta multi-plataforma recibida de OpenAI");

    // Parse the JSON response
    const responseText = response.choices[0].message.content;
    console.log("Texto de respuesta multi-plataforma:", responseText);
    
    if (!responseText) {
      throw new Error("Received empty response from OpenAI for multi-platform content");
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log("Respuesta multi-plataforma analizada correctamente");
      
      // Ensure we have all requested platforms
      const output: Record<string, { content: string, hashtags: string[] | string }> = {};
      for (const platform of platforms) {
        if (result[platform]) {
          output[platform] = {
            content: result[platform].content || "",
            hashtags: result[platform].hashtags || []
          };
        } else {
          // Fallback if platform is missing in the response
          console.log(`Plataforma ${platform} falta en la respuesta, usando valores predeterminados`);
          output[platform] = {
            content: "",
            hashtags: []
          };
        }
      }
      
      return output;
    } catch (parseError) {
      console.error("Error al analizar la respuesta JSON multi-plataforma:", parseError);
      throw new Error(`Failed to parse OpenAI multi-platform response: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Error completo de OpenAI en multi-plataforma:", error);
    if (error.response) {
      console.error("Detalles de la respuesta de error multi-plataforma:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    throw new Error(`Failed to generate multi-platform content: ${error.message}`);
  }
}

// Generate real-time analytics insights using AI
export async function generateRealTimeAnalytics(
  company: string,
  industry: string
): Promise<{ title: string, summary: string, bullets: string[] }> {
  try {
    console.log(`Generando analytics en tiempo real para ${company} en ${industry}`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const systemPrompt = `You are an expert data analyst specializing in real-time business analytics. 
    Generate realistic real-time analytics insights for a business based on current market trends and industry benchmarks.
    Use current date context and realistic metrics that would be relevant for their industry.
    Return your response as JSON with 'title', 'summary', and 'bullets' fields.`;

    const userPrompt = `Generate real-time analytics insights for:
    Company: ${company}
    Industry: ${industry}
    
    Create realistic metrics showing current performance, trends, and key indicators that would be relevant for a ${industry} business.
    Include conversion rates, traffic patterns, engagement metrics, and actionable insights.
    
    Format your response as JSON:
    {
      "title": "Real-Time Performance Dashboard for [Company]",
      "summary": "Current performance analysis with actionable insights",
      "bullets": ["Metric 1 with percentage change", "Metric 2 with actionable insight", "Metric 3 with trend analysis"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = response.choices[0].message.content;
    if (!responseText) {
      throw new Error("Received empty response from OpenAI");
    }

    const result = JSON.parse(responseText);
    return {
      title: result.title || "Real-Time Analytics Dashboard",
      summary: result.summary || "",
      bullets: result.bullets || []
    };
  } catch (error: any) {
    console.error("Error generating real-time analytics:", error);
    throw new Error(`Failed to generate analytics: ${error.message}`);
  }
}

// Generate automation workflow recommendations using AI
export async function generateAutomationFlows(
  company: string,
  industry: string,
  goal: string
): Promise<{ title: string, summary: string, bullets: string[] }> {
  try {
    console.log(`Generando flujos de automatización para ${company}`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const systemPrompt = `You are an expert marketing automation strategist. 
    Design intelligent automation workflows that can realistically be implemented for businesses.
    Focus on lead nurturing, customer journey optimization, and conversion improvements.
    Return your response as JSON with 'title', 'summary', and 'bullets' fields.`;

    const userPrompt = `Design automation workflows for:
    Company: ${company}
    Industry: ${industry}
    Primary Goal: ${goal}
    
    Create a comprehensive automation strategy that addresses their specific industry needs and business goal.
    Include trigger-based sequences, personalization tactics, and measurable outcomes.
    
    Format your response as JSON:
    {
      "title": "Intelligent Automation Flow: [Workflow Name]",
      "summary": "Detailed workflow description with implementation strategy",
      "bullets": ["Automation step 1 with trigger", "Automation step 2 with personalization", "Automation step 3 with outcome"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = response.choices[0].message.content;
    if (!responseText) {
      throw new Error("Received empty response from OpenAI");
    }

    const result = JSON.parse(responseText);
    return {
      title: result.title || "Automation Workflow",
      summary: result.summary || "",
      bullets: result.bullets || []
    };
  } catch (error: any) {
    console.error("Error generating automation flows:", error);
    throw new Error(`Failed to generate automation flows: ${error.message}`);
  }
}

// Generate predictive insights using AI
export async function generatePredictiveInsights(
  company: string,
  industry: string,
  currentData?: any
): Promise<{ title: string, summary: string, bullets: string[] }> {
  try {
    console.log(`Generando insights predictivos para ${company}`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const systemPrompt = `You are an expert data scientist specializing in predictive analytics for marketing and business growth.
    Analyze current market trends, industry data, and business patterns to provide actionable predictive insights.
    Base predictions on realistic market analysis and industry benchmarks.
    Return your response as JSON with 'title', 'summary', and 'bullets' fields.`;

    const userPrompt = `Generate predictive insights for:
    Company: ${company}
    Industry: ${industry}
    Current Context: Based on Q4 2024/Q1 2025 market trends
    
    Provide realistic predictions about market opportunities, growth potential, and strategic recommendations.
    Include probability assessments and actionable next steps.
    
    Format your response as JSON:
    {
      "title": "Predictive Market Analysis for [Company]",
      "summary": "Data-driven predictions with strategic recommendations",
      "bullets": ["Prediction 1 with probability and timeline", "Opportunity 2 with market context", "Recommendation 3 with expected impact"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = response.choices[0].message.content;
    if (!responseText) {
      throw new Error("Received empty response from OpenAI");
    }

    const result = JSON.parse(responseText);
    return {
      title: result.title || "Predictive Market Analysis",
      summary: result.summary || "",
      bullets: result.bullets || []
    };
  } catch (error: any) {
    console.error("Error generating predictive insights:", error);
    throw new Error(`Failed to generate predictive insights: ${error.message}`);
  }
}

// Generate content recommendations based on target audience
export async function generateContentRecommendations(
  audience: string,
  industry: string,
  language: string
): Promise<{ topics: string[], contentTypes: string[], platforms: string[] }> {
  try {
    console.log(`Generando recomendaciones para industria: ${industry} en ${language}`);
    
    // Verificar API key antes de hacer la solicitud
    if (!process.env.OPENAI_API_KEY) {
      console.error("No se pueden generar recomendaciones sin OPENAI_API_KEY");
      throw new Error("OpenAI API key is not configured");
    }
    
    const systemPrompt = `You are an expert digital marketing strategist.
    Create content recommendations for a business based on their target audience and industry.
    Return your response as JSON with 'topics', 'contentTypes', and 'platforms' arrays.`;

    const userPrompt = `Generate content recommendations for a business with the following:
    
    Target audience: ${audience}
    Industry: ${industry}
    Language: ${language}
    
    Format your response as JSON like this:
    {
      "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
      "contentTypes": ["contentType1", "contentType2", "contentType3"],
      "platforms": ["platform1", "platform2", "platform3"]
    }`;

    console.log("Enviando solicitud de recomendaciones a OpenAI");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" }
    });
    console.log("Respuesta de recomendaciones recibida de OpenAI");

    // Parse the JSON response
    const responseText = response.choices[0].message.content;
    console.log("Texto de respuesta de recomendaciones:", responseText);
    
    if (!responseText) {
      throw new Error("Received empty response from OpenAI for recommendations");
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log("Recomendaciones analizadas correctamente:", result);
      
      // Asegurarnos de que los arrays existan
      return {
        topics: result.topics || [],
        contentTypes: result.contentTypes || [],
        platforms: result.platforms || []
      };
    } catch (parseError) {
      console.error("Error al analizar la respuesta JSON de recomendaciones:", parseError);
      throw new Error(`Failed to parse OpenAI recommendations response: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Error completo de OpenAI en recomendaciones:", error);
    if (error.response) {
      console.error("Detalles de la respuesta de error de recomendaciones:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    throw new Error(`Failed to generate content recommendations: ${error.message}`);
  }
}

// =============================================
// STAFF AI BRIEF GENERATION FUNCTIONS
// =============================================

interface AIBriefInput {
  companyName: string;
  website: string;
  industry?: string;
  businessSize?: string;
  challenges?: string;
  audience?: string;
  socialMediaPresence?: string;
  businessGoals?: string;
}

interface AIBriefResult {
  analysis: {
    companyOverview: string;
    marketPosition: string;
    opportunityAreas: string[];
    competitiveAdvantages: string[];
  };
  recommendations: {
    priorityActions: string[];
    quickWins: string[];
    longTermStrategy: string[];
    budgetRecommendation: string;
  };
  email: string;
  leadScore: number;
}

export async function generateAIBrief(input: AIBriefInput): Promise<AIBriefResult> {
  if (!openai) {
    throw new Error("OpenAI not initialized. Please check your API key.");
  }

  console.log("Iniciando generación de AI Brief para:", input.companyName);

  try {
    const systemPrompt = `You are TOBAIS, an expert AI marketing strategist and business analyst specializing in creating comprehensive marketing briefs and personalized outreach for digital agencies.

Your task is to analyze a company's information and generate:
1. A detailed business analysis
2. Strategic marketing recommendations
3. A personalized outreach email
4. A lead quality score (0-100)

Return your response as valid JSON with the following structure:
{
  "analysis": {
    "companyOverview": "Brief description of the company and what they do",
    "marketPosition": "Assessment of their current market position and presence",
    "opportunityAreas": ["List", "of", "key", "opportunity", "areas"],
    "competitiveAdvantages": ["Potential", "competitive", "advantages", "to", "leverage"]
  },
  "recommendations": {
    "priorityActions": ["Top", "3-5", "priority", "marketing", "actions"],
    "quickWins": ["3-4", "quick", "wins", "they", "can", "implement"],
    "longTermStrategy": ["2-3", "long-term", "strategic", "recommendations"],
    "budgetRecommendation": "Suggested monthly marketing budget range and allocation"
  },
  "email": "A personalized, professional email (400-600 words) that:\n- Addresses them by company name\n- Shows you understand their business\n- Presents 2-3 specific marketing opportunities\n- Includes concrete examples or case studies\n- Has a clear call-to-action\n- Maintains a consultative, value-first tone\n- Ends with professional signature from TOBAIS team",
  "leadScore": 75
}

Guidelines for lead scoring:
- 90-100: Large companies with clear digital presence and growth potential
- 70-89: Established businesses with some digital presence, good growth potential  
- 50-69: Small-medium businesses with basic presence, moderate potential
- 30-49: Very small businesses or limited digital presence
- 10-29: Minimal business presence or unclear potential

Email should feel personal and consultative, not sales-heavy. Focus on providing value and insights.`;

    const userPrompt = `Analyze this company and create a comprehensive marketing brief:

Company: ${input.companyName}
Website: ${input.website}
Industry: ${input.industry || 'Not specified'}
Business Size: ${input.businessSize || 'Not specified'}
Current Challenges: ${input.challenges || 'Not specified'}
Target Audience: ${input.audience || 'Not specified'}
Social Media Presence: ${input.socialMediaPresence || 'Not specified'}
Business Goals: ${input.businessGoals || 'Not specified'}

Please provide a thorough analysis, actionable recommendations, and a personalized outreach email that demonstrates value and expertise.`;

    console.log("Enviando solicitud a OpenAI para AI Brief...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    console.log("Respuesta de AI Brief recibida de OpenAI");

    const responseText = response.choices[0].message.content;
    console.log("Texto de respuesta de AI Brief:", responseText?.substring(0, 200) + "...");
    
    if (!responseText) {
      throw new Error("Received empty response from OpenAI for AI brief");
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log("AI Brief analizado correctamente");
      
      // Validate structure
      const briefResult: AIBriefResult = {
        analysis: {
          companyOverview: result.analysis?.companyOverview || "Analysis not available",
          marketPosition: result.analysis?.marketPosition || "Position analysis not available",
          opportunityAreas: result.analysis?.opportunityAreas || [],
          competitiveAdvantages: result.analysis?.competitiveAdvantages || []
        },
        recommendations: {
          priorityActions: result.recommendations?.priorityActions || [],
          quickWins: result.recommendations?.quickWins || [],
          longTermStrategy: result.recommendations?.longTermStrategy || [],
          budgetRecommendation: result.recommendations?.budgetRecommendation || "Budget recommendation not available"
        },
        email: result.email || "Email content not available",
        leadScore: Math.max(1, Math.min(100, result.leadScore || 50))
      };
      
      return briefResult;
    } catch (parseError) {
      console.error("Error al analizar la respuesta JSON de AI Brief:", parseError);
      throw new Error(`Failed to parse OpenAI AI brief response: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Error completo de OpenAI en AI Brief:", error);
    if (error.response) {
      console.error("Detalles de la respuesta de error de AI Brief:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    throw new Error(`Failed to generate AI brief: ${error.message}`);
  }
}
