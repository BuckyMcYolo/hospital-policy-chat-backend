# Hospital Policy Chat - Frontend

The frontend application for an AI-powered healthcare assistant platform, built with Next.js 14 and React Server Components.

🔗 [Live Demo](https://hopital-policy-chat.vercel.app/)

## Features 3 demo apps

### 1. Hospital Policy Search
- Interactive chat interface for querying hospital policies and/or supplies
- Real-time supply location assistance
- Markdown rendering for formatted responses
- Responsive design for various device sizes
- See Sources in chat history for verifying what the AI outputs

### 2. Patient Information Q&A
- Click on a patient to view their:
  - Vital signs
  - Lab results
  - Medications
  - Medical orders
- Ask the AI about any of the information in the chat window to the right

### 3. Voice Interaction System
- Voice-enabled chat interface
- Real-time speech-to-text conversion
- Natural text-to-speech responses
- Role-based interaction modes (ICU Nurse, Charge Nurse, Doctor)
- Ask the AI any questions about your current patients (roles with less patients such as the ICU nurse will receive more in depth information on their patient while roles with many patients (ie Dr) will receive more general information)

## Tech Stack

- **Framework**: Next.js 14 & React 18 with Server Components
- **Styling**: ShadCn & Tailwind CSS
- **API Integration**: 
  - makes API requests to [Backend](https://github.com/BuckyMcYolo/hospital-policy-chat-backend)

## License

MIT License
