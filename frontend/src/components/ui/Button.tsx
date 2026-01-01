export const Button = ({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "secondary" | "light";
  children: React.ReactNode;
}) => {
  const styleBase =
    "py-3 px-8 rounded flex items-center justify-center gap-x-2 font-semibold cursor-pointer";
  const variants = {
    default: "bg-primary text-black hover:bg-primary/90",
    secondary:
      "bg-gray-light border border-transparent text-white hover:border hover:border-white/10",
    light: "bg-white text-black hover:bg-white/90",
  };
  return (
    <button
      className={`${styleBase} ${variants[variant]} ${className && className}`}
    >
      {children}
    </button>
  );
};
