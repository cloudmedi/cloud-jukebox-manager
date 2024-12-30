import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Cloud Media</h2>
            <p className="text-gray-600">Müzik yönetim sisteminiz</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Help & Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">SSS</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">İletişim</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Destek</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Legal & Cookies</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Gizlilik Politikası</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Kullanım Şartları</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Çerez Politikası</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <Button className="w-full">Download App</Button>
            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-500" /> in Istanbul
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;