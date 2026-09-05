// Component: ProfileInfo
// Rendering: Server
// Data: Props-only
// Interaction: Passive

export interface ProfileInfoProps {
  name: string;
  batch: string;
  department: string;
  headingSize?: "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

const headingSizes = {
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

export default function ProfileInfo({
  name,
  batch,
  department,
  headingSize = "4xl",
}: ProfileInfoProps) {
  return (
    <>
      <h1
        className={`${headingSizes[headingSize]} font-bold tracking-tight text-zinc-900`}
      >
        {name}
      </h1>
      <p className="mt-2 text-zinc-600">
        {batch} &middot; {department}
      </p>
    </>
  );
}
