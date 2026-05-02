# House of EdTech

House of EdTech is an AI career workspace built with Next.js. It helps users analyze resumes, compare resumes against job descriptions, generate interview questions, and chat with uploaded PDF documents.

## Features

- **ATS + Summary**: Upload a PDF, DOCX, or TXT resume and generate a professional summary, extracted skills, ATS score, and improvement suggestions.
- **JD Matching**: Upload a resume and either upload or paste a job description. The app returns match score, resume skills, JD skills, and missing skills.
- **Interview Questions**: Upload a resume and generate technical, project-related, experience-related, and managerial questions.
- **Chat with PDF**: Upload a PDF, split it into chunks, create embeddings, store chunks in MongoDB, retrieve relevant chunks with Vector Search, and answer questions using Gemini.
- **Authentication**: Email/password signup and login using NextAuth credentials provider with hashed passwords stored in MongoDB.

## Tech Stack

- **Next.js 16**: App Router, Route Handlers, React 19.
- **React 19**: Client UI and feature panels.
- **Tailwind CSS 4**: Styling and responsive layout.
- **MongoDB + Mongoose**: Stores users, resume analysis, interview questions, and PDF chunks.
- **NextAuth**: Credentials-based authentication.
- **Gemini API**: Resume analysis, JD matching, interview question generation, PDF answers, and embeddings.
- **unpdf**: PDF text extraction.
- **mammoth**: DOCX text extraction.

## AI Models

Text generation uses:

```txt
gemini-2.5-flash
```

Fallback generation model:

```txt
gemini-2.0-flash-lite
```

PDF vector embeddings use:

```txt
gemini-embedding-001
```

Embeddings are created with:

```json
{
  "outputDimensionality": 768
}
```

Document chunks use `RETRIEVAL_DOCUMENT`; user questions use `RETRIEVAL_QUERY`.

## Optimizations

- Gemini calls use exponential backoff with jitter for rate-limit resilience.
- Prompts are intentionally compact and JSON-only to reduce token usage.
- AI JSON responses are cleaned before parsing to handle markdown fences and trailing commas.
- Resume and JD text are truncated before prompting to control cost and latency.
- PDF chunks use overlapping windows to preserve context between chunks.
- MongoDB Vector Search retrieves only the most relevant PDF chunks before sending context to Gemini.
- Auth passwords are hashed with Node `crypto.pbkdf2` and never stored as plain text.

## Environment Variables

Create `.env.local`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/houseof-edtech
GEMINI_API_KEY=your-gemini-api-key
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_VECTOR_INDEX=vector_index
```

Make sure `MONGODB_VECTOR_INDEX` matches the exact Atlas Vector Search index name.

## MongoDB Models

- `User`: stores email and password hash.
- `Resume`: stores ATS analysis result.
- `InterviewQuestion`: stores generated interview questions.
- `Chunk`: stores PDF text chunks and embeddings for vector search.

The `chunks` collection is created when the first chunk document is inserted. A dev seed route exists:

```txt
GET /api/dev/seed-chunk
```

Use it once locally if you need the `chunks` collection to appear before wiring real PDF uploads.

## MongoDB Vector Search Index

Create the index on the `chunks` collection in MongoDB Atlas.

Use JSON editor:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    },
    {
      "type": "filter",
      "path": "userId"
    }
  ]
}
```

If you change the embedding dimensions in code, update `numDimensions` in Atlas too.

## Chat With PDF Flow

1. Upload PDF.
2. Extract text using `unpdf`.
3. Split text into overlapping chunks.
4. Create Gemini embeddings for each chunk.
5. Save chunks in MongoDB.
6. Create a MongoDB Atlas Vector Search index on `embedding`.
7. Embed the user question.
8. Run `$vectorSearch` filtered by `documentId`.
9. Send top chunks plus the question to Gemini and return the answer.

## Authentication

Signup route:

```txt
POST /api/signup
```

NextAuth route:

```txt
/api/auth/[...nextauth]
```

Login uses the Credentials provider. After login, the header shows:

```txt
Welcome, user@example.com
```

instead of Login and Sign up buttons.

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

Type-check:

```bash
pnpm exec tsc --noEmit
```

Lint:

```bash
pnpm lint
```

## Important Notes

- Do not commit `.env.local`.
- Rotate keys if secrets were shared publicly.
- The Vector Search index name in Atlas must match `MONGODB_VECTOR_INDEX`.
- Existing test chunks with zero embeddings should not be used for real PDF chat.
