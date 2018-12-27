import {
  open as openAsync,
  read as readAsync,
  fstat as fstatAsync,
  close as closeAsync,
  write as writeAsync
} from "fs";
import { promisify } from "util";

const open = promisify(openAsync);
const read = promisify(readAsync);
const fstat = promisify(fstatAsync);
const close = promisify(closeAsync);
const write = promisify(writeAsync);

export enum BinaryType {
  Int8 = "Int8",
  UInt8 = "UInt8",
  Int16 = "Int16",
  UInt16 = "UInt16",
  Int32 = "Int32",
  UInt32 = "UInt32",
  Float = "Float",
  Double = "Double"
}

export const binaryLengths = {
  [BinaryType.Int8]: 1,
  [BinaryType.UInt8]: 1,
  [BinaryType.Int16]: 2,
  [BinaryType.UInt16]: 2,
  [BinaryType.Int32]: 4,
  [BinaryType.UInt32]: 4,
  [BinaryType.Float]: 4,
  [BinaryType.Double]: 8
};

export enum Endianness {
  Little = "LE",
  Big = "BE"
}

export class BinaryFile {
  path: string;
  mode: number;
  endianness: Endianness;
  cursor: number;
  fd: number;

  constructor(
    path: string,
    mode: number,
    endianness: Endianness = Endianness.Big
  ) {
    this.path = path;
    this.mode = mode;
    this.endianness = endianness;
    this.cursor = 0;
  }

  async open() {
    this.fd = await open(this.path, this.mode);
    return this;
  }

  async size() {
    const { size } = await fstat(this.fd);
    return size;
  }

  skip(position: number) {
    this.cursor += position;
    return this;
  }

  seek(position: number) {
    this.cursor = position;
    return this;
  }

  tell() {
    return this.cursor;
  }

  async close() {
    await close(this.fd);
  }

  // Read

  async readBuffer(length: number, position?: number): Promise<Buffer> {
    const buffer = new Buffer(length);
    const { bytesRead } = await read(
      this.fd,
      buffer,
      0,
      buffer.length,
      position || this.cursor
    );
    if (typeof position === "undefined") {
      this.cursor += bytesRead;
    }
    return buffer;
  }

  async _readNumericType(type: BinaryType, position: number): Promise<number> {
    const length = binaryLengths[type];
    const buffer = await this.readBuffer(length, position);
    const methodName = `read${type}${length > 1 ? this.endianness : ""}`;
    return buffer[methodName](0);
  }

  async readInt8(position?: number) {
    return this._readNumericType(BinaryType.Int8, position);
  }

  async readUInt8(position?: number) {
    return this._readNumericType(BinaryType.UInt8, position);
  }

  async readInt16(position?: number) {
    return this._readNumericType(BinaryType.Int16, position);
  }

  async readUInt16(position?: number) {
    return this._readNumericType(BinaryType.UInt16, position);
  }

  async readInt32(position?: number) {
    return this._readNumericType(BinaryType.Int32, position);
  }

  async readUInt32(position?: number) {
    return this._readNumericType(BinaryType.UInt32, position);
  }

  async readFloat(position?: number) {
    return this._readNumericType(BinaryType.Float, position);
  }

  async readDouble(position?: number) {
    return this._readNumericType(BinaryType.Double, position);
  }

  async readString(
    length: number,
    position?: number,
    encoding?: string
  ): Promise<string> {
    const buffer = await this.readBuffer(length, position);
    return buffer.toString(encoding);
  }

  // Write

  async writeBuffer(buffer: Buffer, position?: number): Promise<number> {
    const { bytesWritten } = await write(
      this.fd,
      buffer,
      0,
      buffer.length,
      position || this.cursor
    );
    if (typeof position !== "undefined") this.cursor += bytesWritten;
    return bytesWritten;
  }

  async _writeNumericType(
    value: number,
    type: BinaryType,
    position?: number
  ): Promise<number> {
    const length = binaryLengths[type];
    const buffer = new Buffer(length);
    const methodName = `write${type}${length > 1 ? this.endianness : ""}`;
    buffer[methodName](value, 0);
    return this.writeBuffer(buffer, position);
  }

  writeInt8(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.Int8, position);
  }

  writeUInt8(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.UInt8, position);
  }

  writeInt16(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.Int16, position);
  }

  writeUInt16(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.UInt16, position);
  }

  writeInt32(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.Int32, position);
  }

  writeUInt32(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.UInt32, position);
  }

  writeFloat(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.Float, position);
  }

  writeDouble(value: number, position?: number) {
    return this._writeNumericType(value, BinaryType.Double, position);
  }

  writeString(value: string, position?: number, encoding?: string) {
    const buffer = Buffer.from(value, encoding);
    return this.writeBuffer(buffer, position);
  }
}
