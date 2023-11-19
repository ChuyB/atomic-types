import {
  newAtomic,
  newStruct,
  newUnion,
  getOptimized,
  getPacked,
  getUnpacked,
  getWastedBlocks,
  isAtomic,
} from "./registers/registers.js";
import inquirer from "inquirer";
import { Type } from "./registers/registers.types.js";

enum Action {
  ATOMICO,
  STRUCT,
  UNION,
  DESCRIBIR,
  SALIR,
}

async function askForAction() {
  const { action } = await inquirer.prompt({
    name: "action",
    type: "list",
    message: "Seleccione una acción",
    choices: ["ATOMICO", "STRUCT", "UNION", "DESCRIBIR", "SALIR"],
  });

  return Action[action as keyof typeof Action];
}

async function askForAtomic() {
  const { atomic } = await inquirer.prompt({
    name: "atomic",
    type: "input",
    message:
      "Ingrese un nombre, el tamaño de la representación y su alineación",
    default: "int 4 4",
  });

  return atomic;
}

async function askForRegister() {
  const { register } = await inquirer.prompt({
    name: "register",
    type: "input",
    message:
      "Ingrese un nombre y los nombres de los elementos pertenecientes al registro",
    default: "foo int bool",
  });

  return register;
}

async function askTypeName() {
  const { name } = await inquirer.prompt({
    name: "name",
    type: "input",
    message: "Ingrese el nombre del tipo:",
    default: "int",
  });

  return name;
}

const main = async () => {
  let program: Type[] = [];
  while (true) {
    let action: Action = await askForAction();

    let name, rep, alignment, types;

    switch (action) {
      case Action.ATOMICO:
        let atomic: string = await askForAtomic();
        let parsedAtomic = atomic.split(" ");
        if (parsedAtomic.length != 3) {
          console.log(
            "El formato de entrada para tipos atómicos es <nombre> <representación> <alineación>",
          );
          break;
        }
        [name, rep, alignment] = parsedAtomic;
        if (isNaN(Number(rep)) || isNaN(Number(alignment))) {
          console.log("La representación y la alineación deben ser números");
          break;
        }
        let createdAtomic = newAtomic(
          program,
          name,
          Number(rep),
          Number(alignment),
        );
        if (createdAtomic === null) console.log("El tipo ingresado ya existe");
        break;

      case Action.STRUCT:
      case Action.UNION:
        let register: string = await askForRegister();
        let parsedRegister = register.split(" ");
        if (parsedRegister.length < 2) {
          console.log(
            "El formato de entrada para los registros es <nombre> [<tipos>]",
          );
          break;
        }
        [name, ...types] = parsedRegister;

        let createdStruct =
          action == Action.STRUCT
            ? newStruct(program, name, types)
            : newUnion(program, name, types);

        if (createdStruct === null)
          console.log(
            "El tipo que se intenta crear ya existe o algún elemento del registro aún no ha sido creado",
          );

        break;
      case Action.DESCRIBIR:
        let typeName = await askTypeName();
        let type = program.find((el) => el.name == typeName);
        if (type == null) {
          console.log("El tipo ingresado no existe");
          break;
        }

        if (isAtomic(type)) {
          console.log("El tipo ingresado es atómico");
          break;
        }

        let unpacked = getWastedBlocks(getUnpacked(type.types));
        let packed = getWastedBlocks(getPacked(type.types));
        let optimized = getWastedBlocks(getOptimized(type.types));

        console.log(`
          Espacio desperdiciado para el registro ${typeName}
          Sin empaqutar: ${unpacked}
          Con empaquetado: ${packed}
          Optimizado: ${optimized}
        `);

        break;
      case Action.SALIR:
        process.exit(0);
    }
  }
};

await main();
