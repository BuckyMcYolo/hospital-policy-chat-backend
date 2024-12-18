# Hospital Policy Chat - Backend

The backend server for the Hospital AI demo application, providing AI-powered healthcare information retrieval and voice processing capabilities.

🔗 [Live Demo](https://hopital-policy-chat.vercel.app/)

## Features

### 1. Hospital policy & supplies chat
- Integrates Vector database management for hospital policies pdf docs and supplies csv
- Real-time document retrieval and query processing
- provides sources for each RAG retrieval
- Context-aware response generation

### 2. Patient Data Processing
- LlamaIndex integration for medical record indexing
- Secure patient data handling
- Real-time data retrieval and processing

### 3. Voice Processing Pipeline
- Real-time speech-to-text processing using Deepgram
- WebSocket server for continuous audio streaming
- Text-to-speech conversion using Elevenlabs

## Tech Stack

- **Language**: Typescript
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Tools**:
  - OpenAI
  - LlamaIndex
  - DeepGram
- **Database**: 
  - Pinecone Vector DB
- **Cloud Services**:
  - AWS Elastic Beanstalk

## Database Setup

### Pinecone Setup
1. Create a Pinecone account
2. Create a new index with the following settings:
   - Dimension: 1536 (for OpenAI embeddings)
   - Metric: Cosine
   - Pod Type: p1

## Deployment

### AWS Elastic Beanstalk Deployment

1. Automatically deploys to AWS on commits to main

## Monitoring

- AWS CloudWatch integration for logs
- Custom metrics for:
  - API response times
  - WebSocket connections
  - AI processing duration

## License

MIT License
