export enum PesVersion {
  PEC1 = 0,
  PES1 = 1,
  PES2 = 2,
  PES2_2 = 2.2,
  PES3 = 3,
  PES4 = 4,
  PES5 = 5,
  PES5_5 = 5.5,
  PES5_6 = 5.6,
  PES6 = 6,
  PES7 = 7,
  PES8 = 8,
  PES9 = 9,
  PES10 = 10
}

export function parsePesVersion(rawVersion: string): PesVersion {
  if (!rawVersion.startsWith("#")) {
    throw new Error(
      `PES Version header should start with #, instead got "${rawVersion}`
    );
  }

  const type = rawVersion.slice(1, 4);
  if (["PES", "PEC"].indexOf(type) === -1) {
    throw new Error(`Expected format to be PES or PEC, instead got "${type}"`);
  }

  const version = parseInt(rawVersion.slice(5), 10);

  if (type === "PEC") {
    if (version !== 1) {
      throw new Error(
        `Only PEC version 1 is supported, instead got "${version}" ("${rawVersion}")`
      );
    }
    return PesVersion.PEC1;
  }

  switch (version) {
    case 10:
      return PesVersion.PES1;
    case 20:
      return PesVersion.PES2;
    case 22:
      return PesVersion.PES2_2;
    case 30:
      return PesVersion.PES3;
    case 40:
      return PesVersion.PES4;
    case 50:
      return PesVersion.PES5;
    case 55:
      return PesVersion.PES5_5;
    case 56:
      return PesVersion.PES5_6;
    case 60:
      return PesVersion.PES6;
    case 70:
      return PesVersion.PES7;
    case 80:
      return PesVersion.PES8;
    case 90:
      return PesVersion.PES9;
    case 100:
      return PesVersion.PES10;
    default:
      throw new Error(`Unknown PES version "${version}" ("${rawVersion}")`);
  }
}
