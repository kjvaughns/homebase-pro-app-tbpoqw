
/**
 * AI Service
 * Handles communication with the HomeBase AI backend
 */

interface AIRequest {
  user_id: string;
  role: 'provider' | 'homeowner';
  assistant_type: 'provider_assistant' | 'homeowner_assistant';
  message: string;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface AIResponse {
  response: string;
  error?: string;
}

/**
 * Send a message to the AI assistant
 * @param userId - The user's ID
 * @param role - The user's role (provider or homeowner)
 * @param assistantType - The type of assistant (provider_assistant or homeowner_assistant)
 * @param message - The user's message
 * @param conversationHistory - Optional conversation history
 * @returns The assistant's response text
 * @throws Error if the request fails
 */
export async function sendAIMessage(
  userId: string,
  role: 'provider' | 'homeowner',
  assistantType: 'provider_assistant' | 'homeowner_assistant',
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  console.log('AI Service: Sending message to AI assistant...');
  
  // Get the AI endpoint from environment variable
  const endpoint = process.env.EXPO_PUBLIC_HOMEBASE_AI_ENDPOINT;
  
  if (!endpoint) {
    console.warn('AI Service: EXPO_PUBLIC_HOMEBASE_AI_ENDPOINT not configured, using fallback');
    // Return a helpful fallback message
    throw new Error('AI assistant is not configured. Please contact support.');
  }

  try {
    const requestBody: AIRequest = {
      user_id: userId,
      role,
      assistant_type: assistantType,
      message,
      conversation_history: conversationHistory,
    };

    console.log('AI Service: Request payload:', {
      ...requestBody,
      message: message.substring(0, 50) + '...',
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Service: HTTP error:', response.status, errorText);
      throw new Error(`AI service returned ${response.status}: ${errorText}`);
    }

    const data: AIResponse = await response.json();

    if (data.error) {
      console.error('AI Service: API error:', data.error);
      throw new Error(data.error);
    }

    if (!data.response) {
      console.error('AI Service: No response in data:', data);
      throw new Error('AI assistant returned an empty response');
    }

    console.log('AI Service: Response received successfully');
    return data.response;
  } catch (error: any) {
    console.error('AI Service: Error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Unable to connect to AI assistant. Please check your internet connection.');
    }
    
    if (error.message.includes('timeout')) {
      throw new Error('AI assistant is taking too long to respond. Please try again.');
    }
    
    // Re-throw the error with the original message
    throw error;
  }
}
