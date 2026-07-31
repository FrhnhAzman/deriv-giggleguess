import type { Request, Response } from "express";

let appPromise: Promise<typeof import("../server.ts").default> | null = null;

function loadApp() {
  appPromise ??= import("../server.ts").then(module => module.default);
  return appPromise;
}

// Load the Express application lazily so startup errors are logged and return
// a useful protected-preview diagnostic instead of FUNCTION_INVOCATION_FAILED.
export default async function handler(req: Request, res: Response) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    console.error("Failed to initialize GiggleGuess API:", error);
    const detail = error instanceof Error ? error.message : "Unknown startup error";
    return res.status(500).json({
      error: "The playground API failed to start.",
      detail,
    });
  }
}
