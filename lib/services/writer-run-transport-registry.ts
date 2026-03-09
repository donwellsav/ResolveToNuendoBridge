import path from "node:path";

import type {
  WriterRunTransportAdapter,
  WriterRunTransportAdapterId,
  WriterRunTransportEndpoint,
} from "../types";
import { createNodeFilesystemTransportAdapter, createReferenceNoopTransportAdapter } from "./writer-run-transport-adapters";

export function buildWriterRunTransportEndpoint(rootPath: string): WriterRunTransportEndpoint {
  return {
    rootPath,
    outboundPath: path.join(rootPath, "transport", "outbound"),
    inboundPath: path.join(rootPath, "transport", "inbound"),
  };
}

export function createWriterRunTransportRegistry(rootPath: string): {
  adapters: WriterRunTransportAdapter[];
  resolveAdapter: (id?: WriterRunTransportAdapterId) => WriterRunTransportAdapter;
} {
  const endpoint = buildWriterRunTransportEndpoint(rootPath);
  const adapters: WriterRunTransportAdapter[] = [
    createNodeFilesystemTransportAdapter(endpoint),
    createReferenceNoopTransportAdapter(endpoint),
  ];

  return {
    adapters,
    resolveAdapter(id) {
      if (!id) return adapters[0];
      return adapters.find((adapter) => adapter.id === id) ?? adapters[1];
    },
  };
}
