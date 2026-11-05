#!/usr/bin/env node
// Este script vuelve a una app vacía. No lo uses para arrancar WorkFlow: mueve o borra src y herramientas según tu respuesta.

/** Herramienta de la plantilla: vuelve a crear pantallas vacías. No hace falta ejecutarla para usar la app. */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["src", "herramientas"];
const exampleDir = "ejemplo";
const newAppDir = "src/app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Editá src/app/index.tsx para cambiar esta pantalla.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "s") {
      // Creamos la carpeta donde se guarda el ejemplo anterior.
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} carpeta creada.`);
    }

    // Movemos las carpetas al ejemplo o las borramos según la respuesta.
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === "s") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} movido a /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} borrado.`);
        }
      } else {
        console.log(`➡️ /${dir} no existe; seguimos con el resto.`);
      }
    }

    // Creamos la nueva carpeta src/app.
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /src/app carpeta creada.");

    // Creamos la pantalla de inicio.
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 src/app/index.tsx creado.");

    // Creamos la navegación.
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 src/app/_layout.tsx creado.");

    console.log("\n✅ Proyecto reiniciado. Próximos pasos:");
    console.log(
      `1. Ejecutá \`npx expo start\` para levantar el servidor de desarrollo.\n2. Editá src/app/index.tsx para cambiar el inicio.\n3. El código va en /src; en /src/app van las pantallas y su navegación.${
        userInput === "s"
          ? `\n4. Podés borrar la carpeta /${exampleDir} cuando ya no necesites consultarla.`
          : ""
      }`
    );
  } catch (error) {
    console.error(`❌ Error al ejecutar la herramienta: ${error.message}`);
  }
};

rl.question(
  "¿Querés mover los archivos a /ejemplo en lugar de borrarlos? (s/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "s";
    if (userInput === "s" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Respuesta inválida. Escribí 's' or 'n'.");
      rl.close();
    }
  }
);
