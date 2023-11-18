import { Atomic, Struct, Union, Type } from "./registers.types";
let newAtomic = (
  program: Type[],
  name: string,
  rep: number,
  alignment: number,
): Type[] | null => {
  if (program.find((el) => el.name == name) != undefined) return null;
  let newAtomicType: Atomic = {
    name,
    rep,
    alignment,
  };
  program.push(newAtomicType);
  return program;
};

let newStruct = (
  program: Type[],
  name: string,
  types: string[],
): Type[] | null => {
  if (types.length == 0) return null;
  let programTypes = program.filter((element) => types.includes(element.name));

  types.forEach((typeName) => {
    if (program.find((el) => el.name == typeName) == undefined) return null;
  });

  let newStruct: Struct = {
    name,
    types: programTypes,
  };

  program.push(newStruct);
  return program;
};

let newUnion = (
  program: Type[],
  name: string,
  types: string[],
): Type[] | null => {
  let programTypes = program.filter((element) => types.includes(element.name));

  types.forEach((typeName) => {
    if (program.find((el) => el.name == typeName) == undefined) return null;
  });

  let newUnion: Union = {
    name,
    types: programTypes,
  };

  program.push(newUnion);
  return program;
};

const isAtomic = (val: Type): val is Atomic => !!(val as Atomic)?.rep;

const getUnpacked = (types: Type[]): [number, number][] => {
  let blockArr: [number, number][] = isAtomic(types[0])
    ? [[0, types[0].rep]]
    : getUnpacked(types[0].types);

  types.forEach((type) => {
    if (!isAtomic(type)) {
      blockArr.push(...getUnpacked(type.types));
      return;
    }

    let lastEndIndex = blockArr[blockArr.length - 1][1];
    let currentType = type as Atomic;

    for (let i = 0; ; i++) {
      let currentIndex = currentType.rep * i;
      if (currentIndex >= lastEndIndex) {
        blockArr.push([currentIndex, currentIndex + currentType.rep]);
        break;
      }
    }
  });

  return blockArr;
};

const getPacked = (types: Type[]): [number, number][] => {
  let blockArr: [number, number][] = isAtomic(types[0])
    ? [[0, types[0].rep]]
    : getUnpacked(types[0].types);

  return blockArr;
};

const getOptimized = (types: Type[]): [number, number][] => {
  let blockArr: [number, number][] = isAtomic(types[0])
    ? [[0, types[0].rep]]
    : getUnpacked(types[0].types);

  types.forEach((type) => {
    if (!isAtomic(type)) {
      blockArr.push(...getUnpacked(type.types));
      return;
    }

    let lastEndIndex = blockArr[blockArr.length - 1][1];
    let currentType = type as Atomic;
    blockArr.push([lastEndIndex, lastEndIndex + currentType.rep]);
  });

  return blockArr;
};

const getWastedBlocks = (blocks: [number, number][]) => {
  let numberOfWastedBlocks = 0;
  for (let i = 0; i < blocks.length - 1; i++) {
    numberOfWastedBlocks += blocks[i + 1][0] - blocks[i][1];
  }

  return numberOfWastedBlocks;
};

export {
  newAtomic,
  newStruct,
  newUnion,
  getUnpacked,
  getPacked,
  getOptimized,
  getWastedBlocks,
};
