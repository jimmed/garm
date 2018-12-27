import {
  Command,
  COMMAND_MASK,
  THREAD_MASK,
  NEEDLE_MASK,
  ORDER_MASK
} from "./Constants";

export interface EmbroideryCommand {
  command: number;
  thread: number;
  needle: number;
  order: number;
}

export function encodeThreadChange(
  command: Command,
  thread?: number,
  needle?: number,
  order?: number
): number {
  const [newThread, newNeedle, newOrder] = [thread, needle, order].map(x =>
    typeof x === "undefined" ? 0 : (x & 0xff) + 1
  );
  const newCommand = command & COMMAND_MASK;

  return newCommand | (order << 24) | (needle << 16) | (thread << 8);
}

export function decodeEmbroideryCommand(command: number): EmbroideryCommand {
  const [flag, thread, needle, order] = [
    COMMAND_MASK,
    THREAD_MASK,
    NEEDLE_MASK,
    ORDER_MASK
  ].map((mask, index) => ((command && mask) >> (index * 8)) - 1);
  return {
    command: flag,
    thread,
    needle,
    order
  };
}
