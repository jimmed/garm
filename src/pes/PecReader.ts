import { BinaryFile, Endianness } from "../binary/BinaryFile";

export interface Pec {
  name?: string;
  byteStride: number;
  iconHeight: number;
  colourChanges: number;
}

export class PecReader extends BinaryFile {
  constructor(path: string, mode?: number) {
    super(path, mode, Endianness.Little);
  }

  async read(): Promise<Pec> {
    this.skip(3);

    const rawName = await this.readString(16);
    const name = rawName && rawName.trim();

    this.skip(0xf);

    const byteStride = await this.readUInt8();
    const iconHeight = await this.readUInt8();

    this.skip(0xc);

    const colourChanges = await this.readUInt8();

    const colourMap = await this.readColourMap(colourChanges);

    return {
      name,
      byteStride,
      iconHeight,
      colourChanges,
      colourMap
    };
  }

  async readColourMap(changes: number) {
    const count = changes + 1;
  }
}
