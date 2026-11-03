import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { TaskStore } from "@tasksorg/core";
import { resumoDoEscopo } from "./src/resumo";

// Base do app (T4.2.1): só comprova o uso do core. Telas e tema chegam na T4.2.3.
export default function App() {
  const [store] = useState(() => new TaskStore());
  const resumo = resumoDoEscopo(store.list(), "daily");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TasksOrg</Text>
      <Text>{resumo.todo} missões para hoje</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "600" },
});
