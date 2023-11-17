interface Atomic {
  name: string;
  rep: string;
  alignment: number;
}

type Types = (Atomic | Struct | Union)[];

interface Struct {
  name: string;
  types: Types;
}

interface Union {
  name: string;
  types: Types;
}

type Program = (Atomic | Struct | Union)[];

let newAtomic = (
  program: Program,
  name: string,
  rep: string,
  alignment: number,
): Program | null => {
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
  program: Program,
  name: string,
  types: string[],
): Program | null => {
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
  program: Program,
  name: string,
  types: string[],
): Program | null => {
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

export { Atomic, Struct, Union, Program, newAtomic, newStruct, newUnion };
