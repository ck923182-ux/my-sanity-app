import { PortableText } from "@portabletext/react";
import { portableTextComponents } from "./components";

type Props = {
  value: any;
};

export default function PortableTextRenderer({ value }: Props) {
  return (
    <PortableText
      value={value}
      components={portableTextComponents}
    />
  );
}