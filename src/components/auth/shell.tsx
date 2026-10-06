export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-extrabold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
