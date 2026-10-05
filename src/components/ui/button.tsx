import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const sharedButtonStyle =
  "rounded-[10px] border border-[#dfb66b]/40 bg-[#101715]/90 text-[#f4efe6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_22px_rgba(223,182,107,0.1)] hover:border-[#dfb66b]/70 hover:bg-[#151d1a]";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,border-color,background-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: sharedButtonStyle,
        secondary: sharedButtonStyle,
        ghost: sharedButtonStyle,
        danger: sharedButtonStyle,
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
