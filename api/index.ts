import app from "../server";

// All /api requests are rewritten to this single function so the in-memory
// room store and every Express route live in the same serverless bundle.
export default app;
