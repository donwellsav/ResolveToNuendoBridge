const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

const FREESECT = 0xffffffff;
const ENDOFCHAIN = 0xfffffffe;

type OleStream = {
  name: string;
  size: number;
  data: Buffer;
};

function readChain(startSector: number, fat: number[], maxSectors: number): number[] {
  const chain: number[] = [];
  if (startSector === ENDOFCHAIN || startSector === FREESECT || startSector < 0) return chain;

  let current = startSector;
  const visited = new Set<number>();
  while (current !== ENDOFCHAIN && current !== FREESECT) {
    if (current < 0 || current >= fat.length || visited.has(current)) break;
    visited.add(current);
    chain.push(current);
    current = fat[current] ?? ENDOFCHAIN;
    if (chain.length > maxSectors) break;
  }
  return chain;
}

function decodeDirectoryName(entry: Buffer): string {
  const nameLength = entry.readUInt16LE(64);
  if (nameLength < 2) return "";
  return entry
    .subarray(0, nameLength - 2)
    .toString("utf16le")
    .replace(/\u0000/g, "");
}

function collectRecords(buffer: Buffer): string[] {
  const records = new Set<string>();
  const regex = /(TIMELINE|COMPOSITION|TRACK|MOBSLOT|SOURCEMOB|SOURCECLIP|CLIP|EVENT|MARKER|LOCATOR|COMMENT)\b[^\r\n\u0000]*/g;

  for (const encoding of ["utf8", "utf16le"] as const) {
    const text = buffer.toString(encoding);
    for (const match of text.matchAll(regex)) {
      const line = match[0].trim();
      if (line.length > 0) records.add(line);
    }
  }

  return Array.from(records);
}

function readSector(buffer: Buffer, sectorSize: number, sectorId: number): Buffer {
  const offset = 512 + sectorId * sectorSize;
  return buffer.subarray(offset, offset + sectorSize);
}

export function isOleCompoundFile(buffer: Buffer): boolean {
  return buffer.subarray(0, 8).equals(OLE_SIGNATURE);
}

export function extractRecordsFromOleContainer(buffer: Buffer): string {
  if (!isOleCompoundFile(buffer)) return "";

  const sectorShift = buffer.readUInt16LE(30);
  const miniSectorShift = buffer.readUInt16LE(32);
  const sectorSize = 1 << sectorShift;
  const miniSectorSize = 1 << miniSectorShift;
  const numFatSectors = buffer.readUInt32LE(44);
  const firstDirSector = buffer.readUInt32LE(48);
  const miniCutoff = buffer.readUInt32LE(56);
  const firstMiniFatSector = buffer.readUInt32LE(60);
  const numMiniFatSectors = buffer.readUInt32LE(64);

  const difat: number[] = [];
  for (let i = 0; i < 109; i += 1) {
    const value = buffer.readUInt32LE(76 + i * 4);
    if (value !== FREESECT) difat.push(value);
  }

  const fatSectorIds = difat.slice(0, numFatSectors);
  const fat: number[] = [];
  fatSectorIds.forEach((sectorId) => {
    if (sectorId === FREESECT || sectorId === ENDOFCHAIN) return;
    const sector = readSector(buffer, sectorSize, sectorId);
    for (let offset = 0; offset < sectorSize; offset += 4) {
      fat.push(sector.readUInt32LE(offset));
    }
  });

  const dirChain = readChain(firstDirSector, fat, 4096);
  const dirBytes = Buffer.concat(dirChain.map((sectorId) => readSector(buffer, sectorSize, sectorId)));

  type DirectoryEntry = { name: string; type: number; startSector: number; size: number };
  const directoryEntries: DirectoryEntry[] = [];
  for (let offset = 0; offset + 128 <= dirBytes.length; offset += 128) {
    const entry = dirBytes.subarray(offset, offset + 128);
    const type = entry[66];
    if (type === 0) continue;
    const name = decodeDirectoryName(entry);
    const startSector = entry.readUInt32LE(116);
    const low = entry.readUInt32LE(120);
    const high = entry.readUInt32LE(124);
    const size = high * 2 ** 32 + low;
    directoryEntries.push({ name, type, startSector, size });
  }

  const rootEntry = directoryEntries.find((entry) => entry.type === 5);
  const rootMiniStream = rootEntry
    ? Buffer.concat(readChain(rootEntry.startSector, fat, 4096).map((sectorId) => readSector(buffer, sectorSize, sectorId))).subarray(0, rootEntry.size)
    : Buffer.alloc(0);

  const miniFat: number[] = [];
  if (numMiniFatSectors > 0 && firstMiniFatSector !== ENDOFCHAIN && firstMiniFatSector !== FREESECT) {
    const miniFatChain = readChain(firstMiniFatSector, fat, numMiniFatSectors + 8);
    miniFatChain.forEach((sectorId) => {
      const sector = readSector(buffer, sectorSize, sectorId);
      for (let offset = 0; offset < sectorSize; offset += 4) {
        miniFat.push(sector.readUInt32LE(offset));
      }
    });
  }

  const streams: OleStream[] = [];
  directoryEntries
    .filter((entry) => entry.type === 2 && entry.size > 0)
    .forEach((entry) => {
      if (entry.size < miniCutoff && rootMiniStream.length > 0) {
        const miniChain = readChain(entry.startSector, miniFat, 4096);
        const data = Buffer.concat(
          miniChain.map((miniSectorId) => {
            const miniOffset = miniSectorId * miniSectorSize;
            return rootMiniStream.subarray(miniOffset, miniOffset + miniSectorSize);
          })
        ).subarray(0, entry.size);
        streams.push({ name: entry.name, size: entry.size, data });
        return;
      }

      const chain = readChain(entry.startSector, fat, 4096);
      const data = Buffer.concat(chain.map((sectorId) => readSector(buffer, sectorSize, sectorId))).subarray(0, entry.size);
      streams.push({ name: entry.name, size: entry.size, data });
    });

  const records = streams.flatMap((stream) => collectRecords(stream.data));
  return Array.from(new Set(records)).join("\n");
}
