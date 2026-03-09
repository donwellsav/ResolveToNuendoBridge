export function buildOleWithTimelineRecords(lines: string[]): Buffer {
  const sectorSize = 512;
  const miniSectorSize = 64;
  const content = Buffer.from(lines.join("\n"), "utf8");

  const miniSectorCount = Math.max(1, Math.ceil(content.length / miniSectorSize));
  const rootMiniStreamSize = miniSectorCount * miniSectorSize;

  const header = Buffer.alloc(512, 0);
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).copy(header, 0);
  header.writeUInt16LE(0x003e, 24);
  header.writeUInt16LE(0x0003, 26);
  header.writeUInt16LE(0xfffe, 28);
  header.writeUInt16LE(9, 30);
  header.writeUInt16LE(6, 32);
  header.writeUInt32LE(0, 40);
  header.writeUInt32LE(1, 44); // FAT sectors
  header.writeUInt32LE(1, 48); // first dir sector
  header.writeUInt32LE(0x1000, 56);
  header.writeUInt32LE(2, 60); // first mini FAT sector
  header.writeUInt32LE(1, 64); // mini FAT sector count
  header.writeUInt32LE(0xfffffffe, 68);
  header.writeUInt32LE(0, 72);
  header.writeUInt32LE(4, 76); // DIFAT[0] -> FAT sector
  for (let i = 1; i < 109; i += 1) header.writeUInt32LE(0xffffffff, 76 + i * 4);

  const rootStreamSector = Buffer.alloc(sectorSize, 0);
  content.copy(rootStreamSector, 0);

  const directorySector = Buffer.alloc(sectorSize, 0);
  const rootName = Buffer.from("Root Entry\u0000", "utf16le");
  rootName.copy(directorySector, 0);
  directorySector.writeUInt16LE(rootName.length + 2, 64);
  directorySector[66] = 5;
  directorySector.writeInt32LE(-1, 68);
  directorySector.writeInt32LE(-1, 72);
  directorySector.writeInt32LE(1, 76);
  directorySector.writeUInt32LE(0, 116);
  directorySector.writeUInt32LE(rootMiniStreamSize, 120);
  directorySector.writeUInt32LE(0, 124);

  const streamEntryOffset = 128;
  const streamName = Buffer.from("TimelineData\u0000", "utf16le");
  streamName.copy(directorySector, streamEntryOffset);
  directorySector.writeUInt16LE(streamName.length + 2, streamEntryOffset + 64);
  directorySector[streamEntryOffset + 66] = 2;
  directorySector.writeInt32LE(-1, streamEntryOffset + 68);
  directorySector.writeInt32LE(-1, streamEntryOffset + 72);
  directorySector.writeUInt32LE(0, streamEntryOffset + 116);
  directorySector.writeUInt32LE(content.length, streamEntryOffset + 120);
  directorySector.writeUInt32LE(0, streamEntryOffset + 124);

  const miniFatSector = Buffer.alloc(sectorSize, 0xff);
  for (let i = 0; i < miniSectorCount; i += 1) {
    miniFatSector.writeUInt32LE(i + 1 < miniSectorCount ? i + 1 : 0xfffffffe, i * 4);
  }

  const fatSector = Buffer.alloc(sectorSize, 0xff);
  fatSector.writeUInt32LE(0xfffffffe, 0 * 4); // root minis
  fatSector.writeUInt32LE(0xfffffffe, 1 * 4); // directory
  fatSector.writeUInt32LE(0xfffffffd, 2 * 4); // mini FAT
  fatSector.writeUInt32LE(0xfffffffe, 3 * 4); // unused
  fatSector.writeUInt32LE(0xfffffffd, 4 * 4); // FAT sector

  return Buffer.concat([header, rootStreamSector, directorySector, miniFatSector, Buffer.alloc(sectorSize, 0), fatSector]);
}
