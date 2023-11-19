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
  if (program.find((el) => el.name == name) != undefined) return null;
  for (let i = 0; i < types.length; i++) {
    let typeName = types[i];
    if (program.find((el) => el.name == typeName) == undefined) return null;
  }

  let programTypes: Type[] = [];

  for (let i = 0; i < types.length; i++) {
    for (let j = 0; j < program.length; j++) {
      if (types[i] == program[j].name) programTypes.push(program[j]);
    }
  }

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
  if (types.length == 0) return null;
  if (program.find((el) => el.name == name) != undefined) return null;
  for (let i = 0; i < types.length; i++) {
    let typeName = types[i];
    if (program.find((el) => el.name == typeName) == undefined) return null;
  }

  let programTypes: Type[] = [];

  for (let i = 0; i < types.length; i++) {
    for (let j = 0; j < program.length; j++) {
      if (types[i] == program[j].name) programTypes.push(program[j]);
    }
  }

  let flatTypes = plainRegister(programTypes);
  let biggestType = flatTypes.reduce((prev, current) => {
    return (prev as Atomic).rep > (current as Atomic).rep ? prev : current;
  });

  let newUnion: Union = {
    name,
    types: [biggestType],
  };

  program.push(newUnion);
  return program;
};

const isAtomic = (val: Type): val is Atomic => !!(val as Atomic)?.rep;

const getUnpackedR = (types: Type[], base: number): [number, number][] => {
  let blockArr: [number, number][] = isAtomic(types[0])
    ? [[base, base + types[0].rep]]
    : getUnpackedR(types[0].types, base);

  types.slice(1, types.length).forEach((type) => {
    let lastEndIndex = base + blockArr[blockArr.length - 1][1];
    if (!isAtomic(type)) {
      let registerIndexes = getUnpackedR(type.types, lastEndIndex);
      blockArr.push(...registerIndexes);
      return;
    }

    let currentType = type as Atomic;

    for (let i = 0; ; i++) {
      let currentIndex = currentType.alignment * i;
      if (currentIndex >= lastEndIndex) {
        blockArr.push([currentIndex, currentIndex + currentType.rep]);
        break;
      }
    }
  });

  return blockArr;
};

const getUnpacked = (types: Type[]): [number, number][] => {
  return getUnpackedR(types, 0);
};

const getPackedR = (types: Type[], base: number): [number, number][] => {
  let blockArr: [number, number][] = isAtomic(types[0])
    ? [[base, base + types[0].rep]]
    : getPackedR(types[0].types, base);

  types.slice(1, types.length).forEach((type) => {
    let lastEndIndex = base + blockArr[blockArr.length - 1][1];
    if (!isAtomic(type)) {
      let registerIndexes = getPackedR(type.types, lastEndIndex);
      blockArr.push(...registerIndexes);
      return;
    }

    let currentType = type as Atomic;
    blockArr.push([lastEndIndex, lastEndIndex + currentType.rep]);
  });

  return blockArr;
};

const getPacked = (types: Type[]): [number, number][] => {
  return getPackedR(types, 0);
};

const plainRegister = (types: Type[]): Type[] => {
  let plainTypes: Type[] = [];

  types.forEach((type) => {
    if (!isAtomic(type)) {
      let tempPlain = plainRegister(type.types);
      plainTypes.push(...tempPlain);
    } else {
      plainTypes.push(type);
    }
  });

  return plainTypes;
};
const getOptimizedR = (types: Type[], base: number): [number, number][] => {
  let list = [...plainRegister(types)];
  let blockArr: [number, number][] = isAtomic(list[0])
    ? [[base, base + list[0].rep]]
    : getOptimizedR(list[0].types, base);

  list.splice(0, 1);

  while (list.length != 0) {
    let lastEndIndex = base + blockArr[blockArr.length - 1][1];
    let currentListSize = list.length;

    while (list.length == currentListSize) {
      find: for (let i = 0; i < list.length; i++) {
        let type = list[i];
        if (!isAtomic(type)) {
          blockArr.push(...getOptimizedR(type.types, lastEndIndex));
          list.splice(i, 1);
          break find;
        } else {
          for (let j = 0; type.alignment * j <= lastEndIndex; j++) {
            if (type.alignment * j == lastEndIndex) {
              blockArr.push([lastEndIndex, lastEndIndex + type.rep]);
              list.splice(i, 1);
              break find;
            }
          }
        }
      }

      lastEndIndex++;
    }
  }

  return blockArr;
};

const getOptimized = (types: Type[]): [number, number][] => {
  return getOptimizedR(types, 0);
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
  getOptimized,
  getPacked,
  getWastedBlocks,
  isAtomic,
};
