import { Atomic, Struct, Union, Type } from "../src/registers/registers.types";
import {
  getUnpacked,
  getOptimized,
  getPacked,
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

    expect(res).not.toBeNull();
    expect(name).toEqual("foo");
    expect(rep).toEqual(1);
    expect(alignment).toEqual(1);
  });

  it("Should not create an atomic type (already exists)", () => {
    let program: Type[] = [];
    newAtomic(program, "foo", 1, 1);
    let err = newAtomic(program, "foo", 2, 3);

    expect(err).toBeNull();
    expect(program.length).toEqual(1);
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

    expect(res).not.toBeNull();
    expect(name).toEqual("foo");
    expect(atomicName).toEqual("bar");
    expect(atomicRep).toEqual(1);
    expect(atomicAl).toEqual(1);
  });

  it("Should not create a struct (already exists)", () => {
    let program: Type[] = [];
    newAtomic(program, "bar", 1, 1);
    newStruct(program, "foo", ["bar"]);
    let err = newStruct(program, "foo", ["bar"]);

    expect(err).toBeNull();
    expect(program.length).toEqual(2);
  });

  it("Should not create a struct (no types providen)", () => {
    let program: Type[] = [];
    let err = newStruct(program, "foo", []);

    expect(err).toBeNull();
    expect(program.length).toEqual(0);
  });

  it("Should not create a struct (type isn't defined)", () => {
    let program: Type[] = [];
    let err = newStruct(program, "foo", ["bar"]);

    expect(err).toBeNull();
    expect(program.length).toEqual(0);
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

    expect(res).not.toBeNull();
    expect(name).toEqual("foo");
    expect(atomicName).toEqual("bar");
    expect(atomicRep).toEqual(1);
    expect(atomicAl).toEqual(1);
  });

  it("Should not create an union (already exists)", () => {
    let program: Type[] = [];
    newAtomic(program, "bar", 1, 1);
    newUnion(program, "foo", ["bar"]);
    let err = newStruct(program, "foo", ["bar"]);

    expect(err).toBeNull();
    expect(program.length).toEqual(2);
  });

  it("Should not create an union (no types providen)", () => {
    let program: Type[] = [];
    let err = newUnion(program, "foo", []);

    expect(err).toBeNull();
    expect(program.length).toEqual(0);
  });

  it("Should not create an union (type isn't defined)", () => {
    let program: Type[] = [];
    let err = newUnion(program, "foo", ["bar"]);

    expect(err).toBeNull();
    expect(program.length).toEqual(0);
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

    expect(res).not.toBeNull();
    expect(name).toEqual("foobar");
    expect(barName).toEqual("bar");
    expect(atomicName).toEqual("foo");
    expect(atomicRep).toEqual(1);
    expect(atomicAl).toEqual(1);
  });

  it("Should create an union with a struct", () => {
    let program: Type[] = [];
    newAtomic(program, "foo", 1, 1);
    newAtomic(program, "int", 4, 1);
    newStruct(program, "bar", ["foo", "int"]);
    let res = newUnion(program, "foobar", ["bar"]);
    let { name, types } = program.pop() as Union;
    let { name: intName, rep: intRep, alignment: intAl } = types[0] as Atomic;

    expect(res).not.toBeNull();
    expect(name).toEqual("foobar");
    expect(intName).toBe("int");
    expect(intRep).toBe(4);
    expect(intAl).toBe(1);
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
  newUnion(program, "tufoobar", ["int", "sfoobar"]);

  let bar = program[3] as Struct;
  let union = program[4] as Union;
  let struct = program[5] as Struct;
  let tufoobar = program[6] as Union;

  let structUnpackedIndexes = getUnpacked(bar.types);

  it("Should generate unpacked indexes", () => {
    let [fooAl, intAl, boolAl] = structUnpackedIndexes;

    expect(fooAl).toEqual([0, 2]);
    expect(intAl).toEqual([4, 8]);
    expect(boolAl).toEqual([8, 9]);
  });

  it("Should traverse for struct in union types getting unpacked indexes", () => {
    let unionUnpackedIndexes = getUnpacked(union.types);
    expect(unionUnpackedIndexes).toEqual([[0, 4]]);
  });

  it("Should traverse for union in union types getting unpacked indexes", () => {
    let structUnpackedIndexes = getUnpacked(struct.types);
    expect(structUnpackedIndexes).toEqual([[0, 4]]);
  });

  it("Should traverse for struct with union in union types getting upacked indexes", () => {
    let uUnpackedIndexes = getUnpacked(tufoobar.types);
    expect(uUnpackedIndexes).toEqual([[0, 4]]);
  });

  it("Should get number of wasted space for unpacked", () => {
    let n = getWastedBlocks(structUnpackedIndexes);

    expect(n).toBe(2);
  });
});

describe("Packed index management", () => {
  let program: Type[] = [];

  newAtomic(program, "foo", 2, 2);
  newAtomic(program, "int", 4, 4);
  newAtomic(program, "bool", 1, 1);
  newStruct(program, "bar", ["foo", "int", "bool"]);
  newUnion(program, "ufoobar", ["bar", "int", "bool"]);
  newStruct(program, "sfoobar", ["ufoobar"]);
  newUnion(program, "tufoobar", ["int", "ufoobar"]);

  let bar = program[3] as Struct;
  let union = program[4] as Union;
  let struct = program[5] as Struct;
  let tufoobar = program[6] as Union;

  it("Should generate packed indexes", () => {
    let barPackedIndexes = getPacked(bar.types);
    let [fooAl, intAl, boolAl] = barPackedIndexes;
    let exp1 = fooAl[0] == 0 && fooAl[1] == 2;
    let exp2 = intAl[0] == 2 && intAl[1] == 6;
    let exp3 = boolAl[0] == 6 && boolAl[1] == 7;

    expect(exp1).toBe(true);
    expect(exp2).toBe(true);
    expect(exp3).toBe(true);
  });

  it("Should traverse for struct in union types getting packed indexes", () => {
    let unionPackedIndexes = getPacked(union.types);
    expect(unionPackedIndexes).toEqual([[0, 4]]);
  });

  it("Should traverse for union in union types getting packed indexes", () => {
    let structPackedIndexes = getPacked(struct.types);
    expect(structPackedIndexes).toEqual([[0, 4]]);
  });

  it("Should traverse for struct with union in union types getting upacked indexes", () => {
    let uPackedIndexes = getPacked(tufoobar.types);
    expect(uPackedIndexes).toEqual([[0, 4]]);
  });

  it("Should get number of wasted space for packed", () => {
    let barPackedIndexes = getPacked(bar.types);
    let n = getWastedBlocks(barPackedIndexes);

    expect(n).toBe(0);
  });
});

describe("Generates optimized indexes", () => {
  let program: Type[] = [];

  newAtomic(program, "foo", 2, 2);
  newAtomic(program, "int", 4, 4);
  newAtomic(program, "bool", 1, 1);
  newStruct(program, "bar", ["foo", "int", "bool"]);
  newUnion(program, "ufoobar", ["bar", "int", "bool"]);
  newStruct(program, "sfoobar", ["ufoobar"]);
  newUnion(program, "tufoobar", ["int", "ufoobar"]);

  let bar = program[3] as Struct;
  let union = program[4] as Union;
  let struct = program[5] as Struct;
  let tufoobar = program[6] as Union;

  let barOptimizedIndexes = getOptimized(bar.types);
  it("Should generate optimized indexes", () => {
    let [fooAl, intAl, boolAl] = barOptimizedIndexes;
    expect(fooAl).toEqual([0, 2]);
    expect(intAl).toEqual([2, 3]);
    expect(boolAl).toEqual([4, 8]);
  });

  it("Should traverse for struct in union types getting optimized indexes", () => {
    let unionOptimizedIndexes = getOptimized(union.types);
    expect(unionOptimizedIndexes).toEqual([[0, 4]]);
  });

  it("Should traverse for union in union types getting packed indexes", () => {
    let structOptimizedIndexes = getOptimized(struct.types);
    expect(structOptimizedIndexes).toEqual([[0, 4]]);
  });

  it("Should traverse for struct with union in union types getting upacked indexes", () => {
    let uOptimizedIndexes = getOptimized(tufoobar.types);
    expect(uOptimizedIndexes).toEqual([[0, 4]]);
  });

  it("Should get number of wasted space for packed", () => {
    let barOptimizedIndexes = getOptimized(bar.types);
    let n = getWastedBlocks(barOptimizedIndexes);

    expect(n).toBe(1);
  });
});
