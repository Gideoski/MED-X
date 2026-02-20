import { cn } from "@/lib/utils";

const Logo = ({ className }: { className?: string }) => {
  return (
    <img
      src="/images/MED-X logo.jpeg"
      alt="MED-X Logo"
      className={cn("h-8 w-8", className)}
    />
  );
};

export default Logo;
