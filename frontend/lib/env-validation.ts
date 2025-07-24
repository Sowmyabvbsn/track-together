// Simple Environment Validation
export interface EnvConfig {
  // Required
  clerkPublishableKey: string;
  apiUrl: string;
  locationiqApiKey: string;
  
  // Optional
  openaiApiKey?: string;
  mapboxApiKey?: string;
  
  // Feature flags
  enableAI: boolean;
}

export function validateEnvironment(): EnvConfig {
  // Required environment variables
  const requiredVars = {
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    locationiqApiKey: process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY,
  };

  // Check for missing required variables
  const missingRequired = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }

  // Optional variables
  const optionalVars = {
    openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    mapboxApiKey: process.env.NEXT_PUBLIC_MAPBOX_API_KEY,
  };

  // Feature flags
  const enableAI = !!optionalVars.openaiApiKey;

  return {
    ...requiredVars as Required<typeof requiredVars>,
    ...optionalVars,
    enableAI,
  };
}

// Environment status checker
export function getEnvironmentStatus() {
  try {
    const config = validateEnvironment();
    
    return {
      isValid: true,
      config,
      features: {
        authentication: !!config.clerkPublishableKey,
        mapping: !!config.locationiqApiKey,
        aiFeatures: config.enableAI,
        advancedMapping: !!config.mapboxApiKey,
      },
      warnings: generateWarnings(config)
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      features: {},
      warnings: []
    };
  }
}

function generateWarnings(config: EnvConfig): string[] {
  const warnings: string[] = [];
  
  if (!config.openaiApiKey) {
    warnings.push('OpenAI API key missing - AI features will be disabled');
  }
  
  if (!config.mapboxApiKey) {
    warnings.push('Mapbox API key missing - using basic mapping only');
  }
  
  if (config.apiUrl.includes('localhost')) {
    warnings.push('Using localhost API URL - ensure backend is running');
  }
  
  return warnings;
}