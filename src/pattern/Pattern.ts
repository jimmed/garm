import { Command, COMMAND_MASK } from "./Constants";
import { decodeEmbroideryCommand } from "./Functions";
export interface PatternMetadata extends Object {}

export interface Thread {
  description?: string;
}

export interface StitchBlock {
  stitches: Stitch[];
  thread: Thread;
}

export type CommandBlock = Stitch[][];

export interface ColourBlock extends StitchBlock {}

export interface Vectorish {
  x: number;
  y: number;
}

export class Vector {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  static from([x, y]: [number, number]): Vector {
    return new this(x, y);
  }

  clone(): Vector {
    return new Vector(this.x, this.y);
  }

  add({ x = 0, y = 0 }: Vectorish) {
    this.x += x;
    this.y += y;
  }

  subtract({ x = 0, y = 0 }: Vectorish) {
    this.add({ x: -x, y: -y });
  }
}

export class Stitch extends Vector {
  command: Command | number;

  constructor(
    command: Command = Command.NO_COMMAND,
    x: number = 0,
    y: number = 0
  ) {
    super(x, y);
    this.command = command;
  }
}

export class Pattern {
  // TODO: Implement Thread class and make this a static method on it, i.e. `Thread.random()`
  static generateRandomThread() {
    return { description: "random" };
  }

  metadata: PatternMetadata = {};
  stitches: Stitch[] = [];
  threads: Thread[] = [];
  position: Vector = new Vector();

  copy() {
    const pattern = new Pattern();
    pattern.metadata = { ...this.metadata };
    pattern.stitches = [...this.stitches];
    pattern.threads = [...this.threads];
    pattern.position = this.position;
  }

  clear() {
    this.metadata = {};
    this.stitches = [];
    this.threads = [];
    this.position = new Vector();
  }

  addThread(thread: Thread) {
    this.threads.push(thread);
  }

  setMetadata(name: string, data: any) {
    this.metadata[name] = data;
  }

  getMetadata(name: string, defaultValue: any = null) {
    const value = this.metadata[name];
    if (typeof value !== undefined) {
      return value;
    }
    return defaultValue;
  }

  bounds() {
    const xs = this.stitches.map(({ x }) => x);
    const ys = this.stitches.map(({ y }) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, maxX, minY, maxY };
  }

  getCommandsOfType(commandType: Command | number) {
    return this.stitches.filter(
      ({ command }) => (command & COMMAND_MASK) === commandType
    );
  }

  countCommandsOfType(commandType: Command | number) {
    return this.getCommandsOfType(commandType).length;
  }

  countColourChanges() {
    return this.countCommandsOfType(Command.COLOUR_CHANGE);
  }

  countNeedleSets() {
    return this.countCommandsOfType(Command.NEEDLE_SET);
  }

  countStitches() {
    return this.stitches.length;
  }

  countThreads() {
    return this.threads.length;
  }

  getThread(index: number) {
    return this.threads[index];
  }

  getThreadOrFiller(index: number) {
    return this.getThread(index) || Pattern.generateRandomThread();
  }

  asStitchBlock(): StitchBlock[] {
    let threadIndex = 0;
    const blocks = [];
    let block = [];
    this.stitches.forEach(stitch => {
      const command = stitch.command & COMMAND_MASK;
      if (command === Command.STITCH) {
        block.push(stitch);
      } else {
        if (block.length) {
          blocks.push({
            stitches: block,
            thread: this.getThreadOrFiller(threadIndex)
          });
          block = [];
        }
        if (command === Command.COLOUR_CHANGE) {
          threadIndex++;
        }
      }
    });
    return blocks;
  }

  asCommandBlocks(): CommandBlock[] {
    let lastPos = 0;
    let lastCommand = Command.NO_COMMAND;
    const results = [];
    this.stitches.forEach((stitch, index) => {
      const command = stitch.command & COMMAND_MASK;
      if (command === lastCommand || lastCommand === Command.NO_COMMAND) {
        lastCommand = command;
        return;
      }
      lastCommand = command;
      results.push(this.stitches.slice(lastPos, index));
      lastPos = index;
    });
    results.push(this.stitches.slice(lastPos));
    return results;
  }

  asColourBlocks(): ColourBlock[] {
    let threadIndex = 0;
    let lastPos = 0;
    const results = [];
    this.stitches.forEach((stitch, index) => {
      const command = stitch.command & COMMAND_MASK;
      if (command !== Command.COLOUR_CHANGE && command !== Command.NEEDLE_SET) {
        return;
      }
      const thread = this.getThreadOrFiller(threadIndex);
      threadIndex++;
      results.push({ stitches: this.stitches.slice(lastPos, index), thread });
      lastPos = index;
    });
    results.push({ stitches: this.stitches.slice(lastPos) });
    return results;
  }

  asStitches() {
    return this.stitches.map(stitch => {
      const { command, thread, needle, order } = decodeEmbroideryCommand(
        stitch.command
      );
      return { x: stitch.x, y: stitch.y, command, thread, needle, order };
    });
  }

  uniqueThreads() {
    return this.threads.reduce(
      (unique, thread) =>
        unique.indexOf(thread) === -1 ? [...unique, thread] : unique,
      []
    );
  }

  singletonThreads() {
    return this.threads.reduce(
      (singleton, thread, index) =>
        !index || thread !== this.threads[index - 1]
          ? [...singleton, thread]
          : singleton,
      []
    );
  }

  move(delta?: Vectorish) {
    this.addStitchRelative(Command.JUMP, delta);
  }

  moveAbs(pos: Vectorish) {
    this.addStitchAbsolute(Command.JUMP, pos);
  }

  stitch(delta?: Vectorish) {
    this.addStitchRelative(Command.STITCH, delta);
  }

  stitchAbs(pos: Vectorish) {
    this.addStitchAbsolute(Command.STITCH, pos);
  }

  stop(delta?: Vectorish) {
    this.addStitchRelative(Command.STITCH, delta);
  }

  trim(delta?: Vectorish) {
    this.addStitchRelative(Command.STOP, delta);
  }

  colourChange(delta?: Vectorish) {
    this.addStitchRelative(Command.COLOUR_CHANGE, delta);
  }

  needleChange(needle: number = 0, delta?: Vectorish) {
    const command = encodeThreadChange(Command.NEEDLE_SET, null, needle);
    this.addStitchRelative(command, delta);
  }

  sequinEject(delta?: Vectorish) {
    this.addStitchRelative(Command.SEQUIN_EJECT, delta);
  }

  sequinMode(delta?: Vectorish) {
    this.addStitchRelative(Command.SEQUIN_MODE, delta);
  }

  end(delta?: Vectorish) {
    this.addStitchRelative(Command.END, delta);
  }

  moveCentreToOrigin() {
    const { minX, maxX, minY, maxY } = this.bounds();
    const cx = Math.round((maxX - minX) / 2);
    const cy = Math.round((maxY - minY) / 2);
    this.translate({ x: cx, y: cy });
  }

  translate(delta: Vectorish) {
    this.stitches.forEach(stitch => stitch.add(delta));
  }

  transform(matrix: Matrixish) {
    this.stitches.forEach(stitch => stitch.applyMatrix(matrix));
  }

  fixColourCount() {
    let threadIndex = 0;
    let initColour = true;
    this.stitches.forEach(stitch => {
      const command = stitch.command & COMMAND_MASK;
      switch (command) {
        case Command.STITCH:
        case Command.SEW_TO:
        case Command.NEEDLE_AT:
          if (initColour) {
            threadIndex++;
            initColour = false;
          }
          break;
        case Command.COLOUR_CHANGE:
        case Command.COLOUR_BREAK:
          initColour = true;
          break;
      }

      while (this.stitches.length < threadIndex) {
        this.addThread(this.getThreadOrFiller(this.threads.length));
      }
    });
  }

  addStitchAbsolute(command: Command | number, pos: Vectorish) {
    this.stitches.push(new Stitch(command, pos.x, pos.y));
    this.position = new Vector(pos.x, pos.y);
  }

  addStitchRelative(
    command: Command | number,
    delta: Vectorish = new Vector()
  ) {
    const position = this.position.clone();
    position.add(delta);
    this.addStitchAbsolute(command, position);
  }

  prependCommand(command: Command | number, pos: Vectorish) {
    this.stitches.unshift(new Stitch(command, pos.x, pos.y));
  }

  addCommand(command: Command | number, pos: Vectorish) {
    this.stitches.push(new Stitch(command, pos.x, pos.y));
  }

  addStitchBlock({ stitches, thread }: StitchBlock) {
    const { threads } = this;
    if (!threads.length || thread !== threads[threads.length - 1]) {
      threads.push(thread);
      this.addStitchRelative(Command.COLOUR_BREAK);
    } else {
      this.addStitchRelative(Command.SEQUENCE_BREAK);
    }

    stitches.forEach(stitch => {
      this.addStitchAbsolute(stitch.command, { x: stitch.x, y: stitch.y });
    });
  }

  getPatternInterpolateTrim(jumpsRequiredTrim: number): Pattern {
    const pattern = new Pattern();
    let i = -1;
    let ie = this.stitches.length - 1;
    let count = 0;
    let trimmed = true;

    while (i < ie) {
      i++;
      let stitch = this.stitches[i];
      let command = stitch.command & COMMAND_MASK;
      if (command === Command.STITCH || command === Command.SEQUIN_EJECT) {
        trimmed = false;
      } else if (
        command === Command.COLOUR_CHANGE ||
        command === Command.TRIM
      ) {
        trimmed = true;
      }

      if (trimmed || command !== Command.JUMP) {
        pattern.addStitchAbsolute(stitch.command, { x: stitch.x, y: stitch.y });
        continue;
      }

      while (i < ie && command === Command.JUMP) {
        i++;
        stitch = this.stitches[i];
        command = stitch.command;
        count += 1;
      }

      if (command !== Command.JUMP) {
        i--;
      }
      stitch = this.stitches[i];
      if (count >= jumpsRequiredTrim) {
        pattern.trim();
      }
      count = 0;
      pattern.addStitchAbsolute(stitch.command, { x: stitch.x, y: stitch.y });
    }

    pattern.threads.push(...this.threads);
    Object.assign(pattern.metadata, this.metadata);
    return pattern;
  }

  getPatternMergeJumps(): Pattern {
    const pattern = new Pattern();

    let i = -1;
    let ie = this.stitches.length - 1;

    let stitchBreak = false;

    while (i < ie) {
      i++;
      let stitch = this.stitches[i];
      let command = stitch.command & COMMAND_MASK;
      if (command === Command.JUMP) {
        if (stitchBreak) continue;
        pattern.addCommand(Command.STITCH_BREAK, new Vector());
        stitchBreak = true;
        continue;
      }
      pattern.addStitchAbsolute(stitch.command, { x: stitch.x, y: stitch.y });
    }

    pattern.threads.push(...this.threads);
    Object.assign(pattern.metadata, this.metadata);
    return pattern;
  }

  getStablePattern() {
    const pattern = new Pattern();
    this.asStitchBlock().map(block => pattern.addStitchBlock(block));
    Object.assign(pattern.metadata, this.metadata);
    return pattern;
  }

  // TODO: Port the rest of:
  // https://github.com/EmbroidePy/pyembroidery/blob/master/pyembroidery/EmbPattern.py
}
