interface Atomic {
  name: string;
  rep: number;
  alignment: number;
}

interface Struct {
  name: string;
  types: Type[];
}

interface Union {
  name: string;
  types: Type[];
}

type Type = Atomic | Struct | Union;

export { Atomic, Struct, Union, Type };
