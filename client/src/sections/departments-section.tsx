interface Department {
  name: string;
  icon: string;
}

const departments: Department[] = [
  { name: "Aeronautical Engineering", icon: "✈️" },
  { name: "Civil Engineering", icon: "🏗️" },
  { name: "Mechanical Engineering", icon: "⚙️" },
  { name: "AI & Data Science", icon: "🤖" },
  { name: "CSE (Cyber Security)", icon: "🔒" },
  { name: "Computer Science Engineering", icon: "💻" },
  { name: "Information Technology", icon: "🌐" },
  { name: "Electronics & Communication", icon: "📡" },
  { name: "Electrical & Electronics", icon: "⚡" },
];

export function DepartmentsSection() {
  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Our Departments
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600">
          JJCET offers 9 undergraduate programs across various engineering
          disciplines
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div
              key={dept.name}
              className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50"
            >
              <span className="text-2xl">{dept.icon}</span>
              <span className="font-medium text-zinc-900">
                {dept.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
