import React, { AnchorHTMLAttributes, ReactNode } from "react";
import { Button } from "@nextui-org/react";
import Link from "next/link";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href: string;
}

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (props, ref) => {
    const { href, children, ...rest } = props;
    return (
      <Link href={href} passHref>
        <Button>{children}</Button>
      </Link>
    );
  }
);

LinkButton.displayName = "LinkButton";

export default LinkButton;
