import React, { AnchorHTMLAttributes, ReactNode } from "react";
import { Button } from "@nextui-org/react";
import Link from "next/link";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href: string;
}

const LinkButton = (props: LinkButtonProps) => {
  const { href, children } = props;
  return (
    <Button as={Link} href={href}>
      {children}
    </Button>
  );
};
LinkButton.displayName = "LinkButton";

export default LinkButton;
