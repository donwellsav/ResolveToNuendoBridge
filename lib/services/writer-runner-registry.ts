import type { WriterRunRequest, WriterRunResponse, WriterRunner } from "../types";

const referenceNoopRunner: WriterRunner = {
  id: "reference.noop-runner",
  capabilities: ["nuendo_writer.aaf", "video_writer.reference"],
  run(request: WriterRunRequest): WriterRunResponse {
    if (request.runnerReadiness !== "ready") {
      const status = request.runnerReadiness === "unsupported" ? "unsupported" : request.runnerReadiness === "partial" ? "partial" : "blocked";
      return {
        requestId: request.requestId,
        requestVersion: request.requestVersion,
        responseStatus: status,
        responseSequence: request.requestSequence,
        runnerId: this.id,
        message: `No-op runner recorded non-runnable request (${status}) for ${request.artifact.artifactId}.`,
        attempts: [
          {
            attemptSequence: 1,
            attemptedResponseStatus: status,
            message: "Request was not runnable; no binary/session output was attempted.",
          },
        ],
        materialWrite: "none",
      };
    }

    return {
      requestId: request.requestId,
      requestVersion: request.requestVersion,
      responseStatus: "simulated",
      responseSequence: request.requestSequence,
      runnerId: this.id,
      message: `No-op runner simulated execution for ${request.artifact.artifactId}; native Nuendo writing remains intentionally unimplemented in Phase 3F.`,
      attempts: [
        {
          attemptSequence: 1,
          attemptedResponseStatus: "simulated",
          message: "Simulated only. Contracts validated and receipt recorded.",
        },
      ],
      materialWrite: "none",
    };
  },
};

export class WriterRunnerRegistry {
  private readonly runners = new Map<WriterRunner["id"], WriterRunner>();

  constructor() {
    this.register(referenceNoopRunner);
  }

  register(runner: WriterRunner) {
    this.runners.set(runner.id, runner);
  }

  resolve(request: WriterRunRequest): WriterRunner {
    if (request.runnerId && this.runners.has(request.runnerId)) {
      return this.runners.get(request.runnerId)!;
    }
    return this.runners.get("reference.noop-runner")!;
  }

  run(request: WriterRunRequest): WriterRunResponse {
    return this.resolve(request).run(request);
  }
}

export function createDefaultWriterRunnerRegistry(): WriterRunnerRegistry {
  return new WriterRunnerRegistry();
}
