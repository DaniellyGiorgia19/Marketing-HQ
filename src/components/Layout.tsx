import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight text-primary">Marketing HQ</h1>
            <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Negócios</Link>
              <Link to="/brand" className="hover:text-primary transition-colors">Marca</Link>
              <Link to="/campaigns" className="hover:text-primary transition-colors">Campanhas</Link>
              <Link to="/calendar" className="hover:text-primary transition-colors">Calendário</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
             {/* User / Business selector will go here */}
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">HQ</span>
             </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
