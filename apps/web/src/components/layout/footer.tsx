export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} SportHub. All rights reserved.
      </div>
    </footer>
  );
}
