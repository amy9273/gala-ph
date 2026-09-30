import React from "react";
import { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: object;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = "#FFFFFF",
  style,
}) => {
  return <Ionicons name={name} size={size} color={color} style={style} />;
};
