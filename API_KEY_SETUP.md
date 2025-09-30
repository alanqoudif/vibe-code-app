# API Key Setup Guide

## OpenAI API Key Configuration

To fix the OpenAI API key error, you need to set up a valid API key:

### Option 1: Environment Variable (Recommended)
1. Create a `.env` file in the root directory
2. Add your OpenAI API key:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   ```
3. Get your API key from: https://platform.openai.com/account/api-keys

### Option 2: Update app.json
1. Open `app.json`
2. Replace the placeholder key in the `extra.openaiApiKey` field with your actual API key
3. Make sure the key starts with `sk-` and is valid

### Option 3: Use Constants
1. Update the `Constants.expoConfig.extra.openaiApiKey` in your code
2. Make sure to use a valid API key

## Current Issues Fixed

✅ **OpenAI API Key**: Removed hardcoded fallback key, added proper validation
✅ **Real-time Subscriptions**: Optimized to prevent excessive reconnections
✅ **Calendar Loading**: Reduced excessive database calls and logging
✅ **Error Handling**: Improved fallback mechanisms

## Testing

After setting up your API key:
1. Restart your development server
2. Test the AI chat functionality
3. Check that calendar loads without excessive logging
4. Verify real-time updates work properly

## Troubleshooting

- If you still get 401 errors, double-check your API key is valid
- If real-time subscriptions fail, the app will fall back to polling
- Check the console for any remaining errors
