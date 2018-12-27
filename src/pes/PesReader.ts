import { BinaryFile, Endianness } from "../binary/BinaryFile";
import { parsePesVersion, PesVersion } from "./PesVersion";
import { PecReader } from "./PecReader";

export interface Pes {
  version: PesVersion;
  rawVersion: string;
  pecBlockPosition: number;
  header: PesHeader;
}

export interface PesHeader {}

export class PesFile extends BinaryFile {
  constructor(path: string, mode: number) {
    super(path, mode, Endianness.Little);
  }

  async read(): Promise<Pes | Pec> {
    const rawVersion = await this.readString(8, 0, "utf8");
    const pecBlockPosition = await this.readUInt32();

    const version = parsePesVersion(rawVersion);
    const header = await this.readHeader(version);

    if (version === PesVersion.PEC1) {
      return new PecReader(this.path, this.mode).read();
    }

    return { rawVersion, version, pecBlockPosition, header };
  }

  async readHeader(version: PesVersion): Promise<PesHeader> {}
}
