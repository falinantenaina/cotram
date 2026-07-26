export const Container = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className={`px-4 md:px-8 lg:px-16 ${className && className}`}>
      {children}
    </div>
  );
};
