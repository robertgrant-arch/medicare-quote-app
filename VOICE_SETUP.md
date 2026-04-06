# Voice AI Setup Guide - Aria Medicare Assistant

## Overview
This guide covers deploying the voice-based AI assistant ("Aria") that lets consumers interact with your Medicare plan finder via voice on web or phone.

## Architecture
```
User speaks -> Vapi Web SDK (browser) -> Deepgram STT -> GPT-4o -> ElevenLabs TTS -> User hears
                                              |
                                    Function calls hit
                                    /api/voice-webhook
                                              |
                                    Your existing APIs:
                                    /api/plans, /api/formularyCalculator
```

## Files Added
| File | Purpose |
|------|--------|
| `client/src/components/VoiceWidget.tsx` | Frontend voice button + transcript panel |
| `api/voice-webhook.ts` | Vercel serverless function for Vapi tool calls |
| `vapi-assistant-config.json` | Full Vapi assistant config (paste into dashboard) |
| `client/src/App.tsx` | Updated to render VoiceWidget globally |

## Step 1: Install Vapi SDK
```bash
cd client
npm install @vapi-ai/web
```

## Step 2: Create Vapi Account & Assistant
1. Sign up at https://vapi.ai
2. Go to Dashboard > Assistants > Create
3. Copy the contents of `vapi-assistant-config.json` and paste into the assistant config
4. Note your **Assistant ID** from the dashboard
5. Go to Account > API Keys and copy your **Public Key**

## Step 3: Set Up ElevenLabs Voice
1. Sign up at https://elevenlabs.io
2. The config uses voice ID `21m00Tcm4TlvDq8ikWAM` (Rachel - warm female)
3. Alternative voices: `Matilda` or `Charlotte` for different warmth profiles
4. Get your API key from Settings > API Keys
5. Add it to Vapi: Dashboard > Credentials > Add ElevenLabs key

## Step 4: Set Up Deepgram
1. Sign up at https://deepgram.com
2. Create an API key
3. Add it to Vapi: Dashboard > Credentials > Add Deepgram key
4. The config uses `nova-2` model with Medicare-specific keyword boosting

## Step 5: Environment Variables
Add these to your Vercel project (Settings > Environment Variables):
```
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-assistant-id
```

For local development, create `.env` in the client directory:
```
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-assistant-id
```

## Step 6: Configure Webhook URL
In Vapi Dashboard, set your assistant's Server URL to:
```
https://medicare-quote-app.vercel.app/api/voice-webhook
```

## Step 7: Deploy
```bash
git pull origin main
npm install
npm run build
```
Vercel will auto-deploy from main branch.

## Step 8: Add Phone (Optional - Twilio)
1. Sign up at https://twilio.com
2. Buy a phone number
3. In Vapi Dashboard > Phone Numbers > Import from Twilio
4. Assign your Aria assistant to the number
5. Callers can now talk to Aria by dialing the number

## Testing
1. Visit your deployed app
2. Look for the purple microphone button (above the chat button)
3. Click it to start a voice conversation
4. Say "I'm looking for Medicare plans in Kansas City"
5. Aria should ask for your ZIP and recommend plans

## Voice Tuning
In `vapi-assistant-config.json`, adjust these for voice quality:
- `stability: 0.45` - Lower = more expressive, higher = more consistent
- `similarityBoost: 0.75` - How close to the original voice
- `style: 0.35` - Emotional expressiveness

## Cost Estimate (~500 calls/month)
| Service | Monthly Cost |
|---------|------------|
| Vapi | ~$200 (usage-based) |
| ElevenLabs | ~$330 (Scale plan) |
| Deepgram | ~$90 (Pay As You Go) |
| GPT-4o | ~$200 (token-based) |
| Twilio (optional) | ~$200 (phone) |
| **Total** | **~$1,020/month** |

## Compliance Checklist
- [ ] Aria discloses she is not a licensed agent
- [ ] Medicare disclaimer is spoken when recommending plans
- [ ] Always offers to transfer to licensed human agent
- [ ] Call recordings (if enabled) comply with state consent laws
- [ ] TCPA compliance for outbound calls
- [ ] HIPAA: No PHI stored in call transcripts without BAA
