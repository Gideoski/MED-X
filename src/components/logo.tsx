import { cn } from "@/lib/utils";

const Logo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0ZM50 88C29.0122 88 12 70.9878 12 50C12 29.0122 29.0122 12 50 12C70.9878 12 88 29.0122 88 50C88 70.9878 70.9878 88 50 88Z"
        fill="currentColor"
      />
      <path
        d="M50 25C53.3137 25 56 27.6863 56 31V44H69C72.3137 44 75 46.6863 75 50C75 53.3137 72.3137 56 69 56H56V69C56 72.3137 53.3137 75 50 75C46.6863 75 44 72.3137 44 69V56H31C27.6863 56 25 53.3137 25 50C25 46.6863 27.6863 44 31 44H44V31C44 27.6863 46.6863 25 50 25Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default Logo;
