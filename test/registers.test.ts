import { Atomic, Struct, Union, Type } from "../src/registers/registers.types";
import {
  getUnpacked,
  getPacked,
  getOptimized,
  getWastedBlocks,
  newAtomic,
  newStruct,
  newUnion,
} from "../src/registers/registers";

describe("Type creation", () => {
  it("Should create an atomic type", () => {
    let program: Type[] = [];
    let res = newAtomic(program, "foo", 1, 1);
    let { name, rep, alignment } = program.pop() as Atomic;

    expect(res != null);
    expect(name == "foo");
    expect(rep == 1);
    expect(alignment == 1);
  });

  it("Should not create an atomic type (already exists)", () => {
    let program: Type[] = [];
    newAtomic(program, "foo", 1, 1);
    let err = newAtomic(program, "foo", 2, 3);

    expect(err == null);
    expect(program.length == 1);
  });

  it("Should create a struct type", () => {
    let program: Type[] = [];
    let res = newAtomic(program, "bar", 1, 1);
    newStruct(program, "foo", ["bar"]);
    let { name, types } = program.pop() as Struct;
    let {
      name: atomicName,
      rep: atomicRep,
      alignment: atomicAl,
    } = types[0] as Atomic;

    expect(res != null);
    expect(name == "foo");
    expect(atomicName == "bar");
    expect(atomicRep == 1);
    expect(atomicAl == 1);
  });

  it("Should not create a struct (already exists)", () => {
    let program: Type[] = [];
    newAtomic(program, "bar", 1, 1);
    newStruct(program, "foo", ["bar"]);
    let err = newStruct(program, "foo", ["bar"]);

    expect(err == null);
    expect(program.length == 1);
  });

  it("Should not create a struct (no types providen)", () => {
    let program: Type[] = [];
    let err = newStruct(program, "foo", []);

    expect(err == null);
    expect(program.length == 0);
  });

  it("Should not create a struct (type isn't defined)", () => {
    let program: Type[] = [];
    let err = newStruct(program, "foo", ["bar"]);

    expect(err == null);
    expect(program.length == 0);
  });

  it("Should create an union type", () => {
    let program: Type[] = [];
    let res = newAtomic(program, "bar", 1, 1);
    newUnion(program, "foo", ["bar"]);

    let { name, types } = program.pop() as Union;
    let {
      name: atomicName,
      rep: atomicRep,
      alignment: atomicAl,
    } = types[0] as Atomic;

    expect(res != null);
    expect(name == "foo");
    expect(atomicName == "bar");
    expect(atomicRep == 1);
    expect(atomicAl == 1);
  });

  it("Should not create an union (already exists)", () => {
    let program: Type[] = [];
    newAtomic(program, "bar", 1, 1);
    newUnion(program, "foo", ["bar"]);
    let err = newStruct(program, "foo", ["bar"]);

    expect(err == null);
    expect(program.length == 1);
  });

  it("Should not create an union (no types providen)", () => {
    let program: Type[] = [];
    let err = newUnion(program, "foo", []);

    expect(err == null);
    expect(program.length == 0);
  });

  it("Should not create an union (type isn't defined)", () => {
    let program: Type[] = [];
    let err = newUnion(program, "foo", ["bar"]);

    expect(err == null);
    expect(program.length == 0);
  });

  it("Should create a struct with an union", () => {
    let program: Type[] = [];
    newAtomic(program, "foo", 1, 1);
    newUnion(program, "bar", ["foo"]);
    let res = newStruct(program, "foobar", ["bar"]);
    let { name, types } = program.pop() as Struct;
    let { name: barName, types: barTypes } = types[0] as Union;
    let {
      name: atomicName,
      rep: atomicRep,
      alignment: atomicAl,
    } = barTypes[0] as Atomic;

    expect(res != null);
    expect(name == "foobar");
    expect(barName == "bar");
    expect(atomicName == "foo");
    expect(atomicRep == 1);
    expect(atomicAl == 1);
  });

  it("Should create an union with a struct", () => {
    let program: Type[] = [];
    newAtomic(program, "foo", 1, 1);
    newStruct(program, "bar", ["foo"]);
    let res = newUnion(program, "foobar", ["bar"]);
    let { name, types } = program.pop() as Union;
    let { name: barName, types: barTypes } = types[0] as Struct;
    let {
      name: atomicName,
      rep: atomicRep,
      alignment: atomicAl,
    } = barTypes[0] as Atomic;

    expect(res != null);
    expect(name == "foobar");
    expect(barName == "bar");
    expect(atomicName == "foo");
    expect(atomicRep == 1);
    expect(atomicAl == 1);
  });
});

describe("Unpacked index management", () => {
  let program: Type[] = [];

  newAtomic(program, "foo", 2, 2);
  newAtomic(program, "int", 4, 4);
  newAtomic(program, "bool", 1, 1);
  newStruct(program, "bar", ["foo", "int", "bool"]);
  newUnion(program, "ufoobar", ["bar", "int", "bool"]);
  newStruct(program, "sfoobar", ["ufoobar"]);

  let bar = program[3] as Struct;
  let union = program[4] as Union;
  let struct = program[5] as Struct;

  let structUnpackedIndexes = getUnpacked(bar.types);

  it("Should generate unpacked indexes", () => {
    let [fooAl, intAl, boolAl] = structUnpackedIndexes;
    let exp1 = fooAl[0] == 0 && fooAl[1] == 2;
    let exp2 = intAl[0] == 4 && intAl[1] == 8;
    let exp3 = boolAl[0] == 9 && boolAl[1] == 10;

    expect(exp1);
    expect(exp2);
    expect(exp3);
  });

  it("Should traverse for struct in union types getting unpacked indexes", () => {
    let unionUnpackedIndexes = getUnpacked(union.types);
    let [fooAl, intAl, boolAl] = unionUnpackedIndexes;
    let exp1 = fooAl[0] == 0 && fooAl[1] == 2;
    let exp2 = intAl[0] == 4 && intAl[1] == 8;
    let exp3 = boolAl[0] == 9 && boolAl[1] == 10;

    expect(exp1);
    expect(exp2);
    expect(exp3);
  });

  it("Should traverse for union in union types getting unpacked indexes", () => {
    let structUnpackedIndexes = getUnpacked(struct.types);
    let [fooAl, intAl, boolAl] = structUnpackedIndexes;
    let exp1 = fooAl[0] == 0 && fooAl[1] == 2;
    let exp2 = intAl[0] == 4 && intAl[1] == 8;
    let exp3 = boolAl[0] == 9 && boolAl[1] == 10;

    expect(exp1);
    expect(exp2);
    expect(exp3);
  });

  it("Should get number of wasted space for unpacked", () => {
    let n = getWastedBlocks(structUnpackedIndexes);

    expect(n == 2);
  });
});

describe("Optmized index management", () => {
  let program: Type[] = [];

  newAtomic(program, "foo", 2, 2);
  newAtomic(program, "int", 4, 4);
  newAtomic(program, "bool", 1, 1);
  newStruct(program, "bar", ["foo", "int", "bool"]);
  newUnion(program, "ufoobar", ["bar", "int", "bool"]);
  newStruct(program, "sfoobar", ["ufoobar"]);

  let bar = program[3] as Struct;
  let union = program[4] as Union;
  let struct = program[5] as Struct;

  it("Should generate optimized indexes", () => {
    let barOptimizedIndexes = getOptimized(bar.types);
    let [fooAl, intAl, boolAl] = barOptimizedIndexes;
    let exp1 = fooAl[0] == 0 && fooAl[1] == 2;
    let exp2 = intAl[0] == 2 && intAl[1] == 6;
    let exp3 = boolAl[0] == 6 && boolAl[1] == 7;

    expect(exp1);
    expect(exp2);
    expect(exp3);
  });

  it("Should traverse for struct in union types getting optimized indexes", () => {
    let unionOptimizedIndexes = getOptimized(union.types);
    let [fooAl, intAl, boolAl] = unionOptimizedIndexes;
    let exp1 = fooAl[0] == 0 && fooAl[1] == 2;
    let exp2 = intAl[0] == 2 && intAl[1] == 6;
    let exp3 = boolAl[0] == 6 && boolAl[1] == 7;

    expect(exp1);
    expect(exp2);
    expect(exp3);
  });

  it("Should traverse for union in union types getting optimized indexes", () => {
    let structOptimizedIndexes = getOptimized(struct.types);
    let [fooAl, intAl, boolAl] = structOptimizedIndexes;
    let exp1 = fooAl[0] == 0 && fooAl[1] == 2;
    let exp2 = intAl[0] == 2 && intAl[1] == 6;
    let exp3 = boolAl[0] == 6 && boolAl[1] == 7;

    expect(exp1);
    expect(exp2);
    expect(exp3);
  });

  it("Should get number of wasted space for unpacked", () => {
    let barOptimizedIndexes = getOptimized(bar.types);
    let n = getWastedBlocks(barOptimizedIndexes);

    expect(n == 0);
  });
});
