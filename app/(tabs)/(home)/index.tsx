
import React from "react";
import { FlatList, StyleSheet, View, Image } from "react-native";
import { useTheme } from "@react-navigation/native";
import { modalDemos } from "@/components/homeData";
import { DemoCard } from "@/components/DemoCard";

const HOMEBASE_LOGO = require('@/assets/images/6136aa2f-9e1a-404d-8c64-88ff07e19023.png');

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image
        source={HOMEBASE_LOGO}
        style={styles.logo}
        resizeMode="contain"
      />
      <FlatList
        data={modalDemos}
        renderItem={({ item }) => <DemoCard item={item} />}
        keyExtractor={(item) => item.route}
        contentContainerStyle={styles.listContainer}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  logo: {
    width: 150,
    height: 80,
    alignSelf: "center",
    marginTop: 60,
    marginBottom: 20,
  },
});
