import { Link, type LinkProps } from "react-router-dom";
import clsx from "clsx";

type LinkButtonProps = LinkProps & {
  variant?: "plain" | "back";
};

export default function LinkButton({
  children,
  className,
  variant = "plain",
  ...props
}: LinkButtonProps) {
  const styles = {
    plain: "text-blue-900 font-medium hover:underline",
    back: "inline-flex items-center gap-2 text-blue-700 font-semibold hover:underline",
  };

  return (
        <Link {...props} className={clsx(styles[variant], className)}>
            {children}
        </Link>
  );
}