import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Users,
  Image,
  FileText
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut, user } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
    { path: '/admin/products', icon: Package, label: 'প্রোডাক্ট' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'অর্ডার' },
    { path: '/admin/categories', icon: FileText, label: 'ক্যাটাগরি' },
    { path: '/admin/banners', icon: Image, label: 'ব্যানার' },
    { path: '/admin/product-requests', icon: Users, label: 'প্রোডাক্ট রিকোয়েস্ট' },
    { path: '/admin/settings', icon: Settings, label: 'সেটিংস' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">Anas Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">অ্যাডমিন প্যানেল</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-4 p-3 bg-accent rounded-lg">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">অ্যাডমিন</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            লগআউট
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
