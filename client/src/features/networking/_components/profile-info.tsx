// Component: ProfileInfo
// Rendering: Server
// Data: Props-only
// Interaction: Passive

export interface ProfileInfoProps {
  name: string;
  batch: string;
  department: string;
}

export default function ProfileInfo({ name, batch, department }: ProfileInfoProps) {
  return (
    <>
      <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
      <p className="mt-1 text-text-secondary">
        {batch} &middot; {department}
      </p>
    </>
  );
}
